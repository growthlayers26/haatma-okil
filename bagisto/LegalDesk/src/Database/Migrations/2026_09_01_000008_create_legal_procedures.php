<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The rules that must not depend on the application being correct.
 *
 * These were `SECURITY DEFINER` functions in Postgres. They are here, in the
 * database, for one reason: each of them is a rule that a bug in application code
 * must not be able to violate. An advocate must not approve their own draft. Two
 * requests arriving together must not spend the same allowance twice. A digital
 * envelope must not complete without a verified certificate behind every signature.
 *
 * Moving off Postgres cost the row-level security that used to sit alongside these —
 * access control now lives in the Next.js server actions. That makes keeping the
 * *conduct* rules down here more important than it was before, not less: they are now
 * the only enforcement that survives a mistake upstairs.
 *
 * Each procedure manages its own transaction, because a `FOR UPDATE` lock under
 * autocommit is held only for the length of the statement and would guarantee
 * nothing. Callers must therefore NOT wrap these in an outer transaction.
 *
 * Every procedure returns a single row with a `result` column, so the caller reads an
 * outcome rather than catching an exception.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->routines() as $name => $sql) {
            $type = str_contains($sql, 'CREATE FUNCTION') ? 'FUNCTION' : 'PROCEDURE';
            DB::unprepared("DROP {$type} IF EXISTS `{$name}`");
            DB::unprepared($sql);
        }
    }

    public function down(): void
    {
        foreach ($this->routines() as $name => $sql) {
            $type = str_contains($sql, 'CREATE FUNCTION') ? 'FUNCTION' : 'PROCEDURE';
            DB::unprepared("DROP {$type} IF EXISTS `{$name}`");
        }
    }

    private function routines(): array
    {
        return [
            /*
             * A person's role in an organisation, or NULL if they are not a member.
             */
            'legal_org_role' => <<<'SQL'
CREATE FUNCTION `legal_org_role`(p_org CHAR(36), p_customer INT UNSIGNED)
RETURNS VARCHAR(16)
READS SQL DATA
BEGIN
  DECLARE v_role VARCHAR(16) DEFAULT NULL;
  SELECT role INTO v_role
    FROM legal_memberships
   WHERE org_id = p_org AND customer_id = p_customer
   LIMIT 1;
  RETURN v_role;
END
SQL,

            /*
             * Take one unit of the monthly allowance.
             *
             * The FOR UPDATE lock on the subscription row is what makes this safe: two
             * requests arriving together serialise on it, so the second sees the
             * first's insert and is correctly refused at the limit. Counting without
             * the lock would let both pass.
             *
             * Returns the id of the usage row created, or NULL when there is no active
             * subscription, the plan includes none of this kind, or the month's
             * allowance is exhausted. NULL is not an error — it means the matter is
             * billed per use instead.
             *
             * Returning the id rather than a boolean is what lets the caller link the
             * unit to the matter it paid for, and hand it back if opening that matter
             * then fails.
             */
            'legal_consume_quota' => <<<'SQL'
CREATE PROCEDURE `legal_consume_quota`(IN p_customer INT UNSIGNED, IN p_kind VARCHAR(16))
BEGIN
  DECLARE v_sub    CHAR(36) DEFAULT NULL;
  DECLARE v_limit  INT      DEFAULT 0;
  DECLARE v_used   INT      DEFAULT 0;
  DECLARE v_window DATETIME;
  DECLARE v_usage  CHAR(36) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT id,
         CASE p_kind WHEN 'question' THEN questions_per_month
                     WHEN 'review'   THEN reviews_per_month END
    INTO v_sub, v_limit
    FROM legal_subscriptions
   WHERE customer_id = p_customer
     AND status = 'active'
     AND current_period_end > NOW()
   FOR UPDATE;

  IF v_sub IS NULL OR IFNULL(v_limit, 0) <= 0 THEN
    COMMIT;
    SELECT NULL AS result;
  ELSE
    -- Anchored to the calendar month rather than the billing anniversary: "five
    -- questions a month" should mean what a subscriber assumes it means.
    SET v_window = DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00');

    SELECT COUNT(*) INTO v_used
      FROM legal_quota_usage
     WHERE subscription_id = v_sub AND kind = p_kind AND period_start = v_window;

    IF v_used >= v_limit THEN
      COMMIT;
      SELECT NULL AS result;
    ELSE
      SET v_usage = UUID();
      INSERT INTO legal_quota_usage (id, subscription_id, customer_id, kind, period_start, consumed_at)
      VALUES (v_usage, v_sub, p_customer, p_kind, v_window, NOW());
      COMMIT;
      SELECT v_usage AS result;
    END IF;
  END IF;
END
SQL,

            /*
             * Hand a consumed unit back.
             *
             * Called when the matter the unit was taken for could not be opened.
             * Deleting the usage row restores the allowance, because the allowance is
             * computed by counting rows rather than by decrementing a stored counter —
             * which is precisely why it was modelled that way.
             */
            'legal_release_quota' => <<<'SQL'
CREATE PROCEDURE `legal_release_quota`(IN p_usage CHAR(36))
BEGIN
  DELETE FROM legal_quota_usage WHERE id = p_usage;
  SELECT 'ok' AS result;
END
SQL,

            /*
             * Remaining allowance for the current month, without consuming any.
             *
             * Read-only, so it takes no lock — a number shown in the UI may be one
             * request stale, which is harmless. Only legal_consume_quota gates anything.
             */
            'legal_quota_remaining' => <<<'SQL'
CREATE PROCEDURE `legal_quota_remaining`(IN p_customer INT UNSIGNED, IN p_kind VARCHAR(16))
BEGIN
  SELECT GREATEST(
           0,
           IFNULL(
             (CASE p_kind WHEN 'question' THEN s.questions_per_month
                          WHEN 'review'   THEN s.reviews_per_month END)
             - (SELECT COUNT(*) FROM legal_quota_usage u
                 WHERE u.subscription_id = s.id
                   AND u.kind = p_kind
                   AND u.period_start = DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')),
             0
           )
         ) AS result
    FROM legal_subscriptions s
   WHERE s.customer_id = p_customer
     AND s.status = 'active'
     AND s.current_period_end > NOW();
END
SQL,

            /*
             * Activate or renew a subscription. Called only from the order-paid path.
             *
             * A renewal extends from the later of now and the existing period end, so
             * renewing early does not forfeit days already paid for.
             */
            'legal_activate_subscription' => <<<'SQL'
CREATE PROCEDURE `legal_activate_subscription`(
  IN p_customer  INT UNSIGNED,
  IN p_plan      VARCHAR(16),
  IN p_period    VARCHAR(16),
  IN p_questions INT,
  IN p_reviews   INT,
  IN p_seats     INT
)
BEGIN
  DECLARE v_from DATETIME DEFAULT NULL;
  DECLARE v_end  DATETIME;
  DECLARE v_id   CHAR(36) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT id, GREATEST(NOW(), IFNULL(current_period_end, NOW()))
    INTO v_id, v_from
    FROM legal_subscriptions
   WHERE customer_id = p_customer
   FOR UPDATE;

  SET v_from = IFNULL(v_from, NOW());
  SET v_end  = IF(p_period = 'annual',
                  DATE_ADD(v_from, INTERVAL 1 YEAR),
                  DATE_ADD(v_from, INTERVAL 1 MONTH));

  IF v_id IS NULL THEN
    SET v_id = UUID();
    INSERT INTO legal_subscriptions
      (id, customer_id, plan_id, billing_period, status,
       questions_per_month, reviews_per_month, seats,
       current_period_start, current_period_end, created_at, updated_at)
    VALUES
      (v_id, p_customer, p_plan, p_period, 'active',
       p_questions, p_reviews, p_seats, NOW(), v_end, NOW(), NOW());
  ELSE
    UPDATE legal_subscriptions
       SET plan_id              = p_plan,
           billing_period       = p_period,
           status               = 'active',
           questions_per_month  = p_questions,
           reviews_per_month    = p_reviews,
           seats                = p_seats,
           current_period_start = NOW(),
           current_period_end   = v_end,
           updated_at           = NOW()
     WHERE id = v_id;
  END IF;

  COMMIT;
  SELECT v_id AS result;
END
SQL,

            /*
             * Claim one paid, unspent entitlement of a given kind.
             *
             * The FOR UPDATE SKIP LOCKED is what stops two reviews fired together from
             * spending the same entitlement — the same failure legal_consume_quota
             * avoids, and the same fix.
             *
             * Returns the entitlement id, or NULL when the customer has nothing paid to
             * spend. NULL is not an error: it means the caller must ask for payment
             * before doing the work.
             */
            'legal_claim_entitlement' => <<<'SQL'
CREATE PROCEDURE `legal_claim_entitlement`(
  IN p_customer INT UNSIGNED,
  IN p_kind     VARCHAR(16),
  IN p_service  VARCHAR(255)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT id INTO v_id
    FROM legal_entitlements
   WHERE customer_id = p_customer
     AND kind = p_kind
     -- A null p_service means "any of this kind". Passing one narrows to the exact
     -- service, which is what keeps a NPR 12,999 trademark filing from being spent
     -- as though it were a NPR 9,999 company registration.
     AND (p_service IS NULL OR service_id = p_service)
     AND consumed_at IS NULL
   ORDER BY created_at
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_id IS NOT NULL THEN
    UPDATE legal_entitlements SET consumed_at = NOW(), updated_at = NOW() WHERE id = v_id;
  END IF;

  COMMIT;
  SELECT v_id AS result;
END
SQL,

            /** Return an entitlement to the unspent pool when the work did not complete. */
            'legal_release_entitlement' => <<<'SQL'
CREATE PROCEDURE `legal_release_entitlement`(IN p_id CHAR(36))
BEGIN
  UPDATE legal_entitlements SET consumed_at = NULL, updated_at = NOW() WHERE id = p_id;
  SELECT 'ok' AS result;
END
SQL,

            /*
             * Pick the advocate for an enquiry: prefer one who lists the practice area,
             * and among those take the lightest open load. Falls back to any active
             * advocate so an unmatched area never leaves an enquiry unassigned.
             *
             * Conflict screening is deliberately NOT done here — it happens before the
             * matter is described, and a conflicted enquiry never reaches assignment.
             */
            'legal_assign_advocate' => <<<'SQL'
CREATE PROCEDURE `legal_assign_advocate`(IN p_area VARCHAR(64))
BEGIN
  SELECT a.id AS result
    FROM legal_advocates a
    LEFT JOIN legal_enquiries e
      ON e.advocate_id = a.id AND e.status IN ('screening', 'assigned')
   WHERE a.active = 1
   GROUP BY a.id, a.practice_areas, a.capacity
  HAVING COUNT(e.id) < a.capacity
   ORDER BY JSON_CONTAINS(a.practice_areas, JSON_QUOTE(p_area)) DESC,
            COUNT(e.id) ASC,
            a.id
   LIMIT 1;
END
SQL,

            /*
             * Approve or reject a document drafted inside an organisation.
             *
             * The self-approval refusal is the point of this procedure. Someone with
             * admin rights must not sign off their own draft, and that must hold even
             * if the UI forgets to hide the button.
             */
            'legal_decide_document' => <<<'SQL'
CREATE PROCEDURE `legal_decide_document`(
  IN p_document CHAR(36),
  IN p_actor    INT UNSIGNED,
  IN p_approve  TINYINT(1),
  IN p_note     TEXT
)
BEGIN
  DECLARE v_org   CHAR(36) DEFAULT NULL;
  DECLARE v_owner INT UNSIGNED DEFAULT NULL;
  DECLARE v_role  VARCHAR(16) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT org_id, customer_id INTO v_org, v_owner
    FROM legal_documents WHERE id = p_document FOR UPDATE;

  IF v_org IS NULL THEN
    COMMIT;
    SELECT 'not_org_document' AS result;
  ELSE
    SET v_role = legal_org_role(v_org, p_actor);

    IF v_role IS NULL OR v_role = 'member' THEN
      COMMIT;
      SELECT 'not_permitted' AS result;
    ELSEIF v_owner = p_actor THEN
      COMMIT;
      SELECT 'self_approval' AS result;
    ELSE
      UPDATE legal_documents
         SET approval_status = IF(p_approve, 'approved', 'rejected'),
             approved_by     = p_actor,
             approved_at     = NOW(),
             review_note     = p_note
       WHERE id = p_document AND approval_status = 'pending';

      IF ROW_COUNT() = 0 THEN
        COMMIT;
        SELECT 'not_pending' AS result;
      ELSE
        COMMIT;
        SELECT 'ok' AS result;
      END IF;
    END IF;
  END IF;
END
SQL,

            /** Create an organisation and seat its owner in one transaction. */
            'legal_create_organisation' => <<<'SQL'
CREATE PROCEDURE `legal_create_organisation`(IN p_owner INT UNSIGNED, IN p_name VARCHAR(255))
BEGIN
  DECLARE v_org CHAR(36);

  START TRANSACTION;
  SET v_org = UUID();

  INSERT INTO legal_organisations (id, name, owner_id, seats, created_at, updated_at)
  VALUES (v_org, p_name, p_owner, 1, NOW(), NOW());

  -- The owner occupies a seat like anyone else. Excluding them would silently sell
  -- one more seat than the plan says.
  INSERT INTO legal_memberships (id, org_id, customer_id, role, created_at, updated_at)
  VALUES (UUID(), v_org, p_owner, 'owner', NOW(), NOW());

  COMMIT;
  SELECT v_org AS result;
END
SQL,

            /*
             * Seat someone in an organisation, refusing to exceed the seats the owner's
             * plan actually pays for.
             */
            'legal_add_org_member' => <<<'SQL'
CREATE PROCEDURE `legal_add_org_member`(
  IN p_org      CHAR(36),
  IN p_customer INT UNSIGNED,
  IN p_role     VARCHAR(16)
)
BEGIN
  DECLARE v_owner  INT UNSIGNED DEFAULT NULL;
  DECLARE v_seats  INT DEFAULT NULL;
  DECLARE v_used   INT DEFAULT 0;
  DECLARE v_exists INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT owner_id INTO v_owner FROM legal_organisations WHERE id = p_org FOR UPDATE;

  IF v_owner IS NULL THEN
    COMMIT;
    SELECT 'no_org' AS result;
  ELSE
    SELECT COUNT(*) INTO v_exists
      FROM legal_memberships WHERE org_id = p_org AND customer_id = p_customer;

    IF v_exists > 0 THEN
      COMMIT;
      SELECT 'already_member' AS result;
    ELSE
      SELECT seats INTO v_seats
        FROM legal_subscriptions
       WHERE customer_id = v_owner AND status = 'active' AND current_period_end > NOW();

      IF v_seats IS NULL THEN
        COMMIT;
        SELECT 'no_subscription' AS result;
      ELSE
        SELECT COUNT(*) INTO v_used FROM legal_memberships WHERE org_id = p_org;

        IF v_used >= v_seats THEN
          COMMIT;
          SELECT 'seat_limit' AS result;
        ELSE
          INSERT INTO legal_memberships (id, org_id, customer_id, role, created_at, updated_at)
          VALUES (UUID(), p_org, p_customer, p_role, NOW(), NOW());
          COMMIT;
          SELECT 'ok' AS result;
        END IF;
      END IF;
    END IF;
  END IF;
END
SQL,

            /*
             * Record a wet-ink signature: the executed copy has been uploaded.
             */
            'legal_record_wet_ink_signature' => <<<'SQL'
CREATE PROCEDURE `legal_record_wet_ink_signature`(
  IN p_signatory CHAR(36),
  IN p_actor     INT UNSIGNED,
  IN p_path      VARCHAR(255)
)
BEGIN
  DECLARE v_envelope CHAR(36) DEFAULT NULL;
  DECLARE v_status   VARCHAR(16) DEFAULT NULL;
  DECLARE v_method   VARCHAR(32) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT s.envelope_id, s.status, e.method
    INTO v_envelope, v_status, v_method
    FROM legal_signatories s
    JOIN legal_signature_envelopes e ON e.id = s.envelope_id
   WHERE s.id = p_signatory
   FOR UPDATE;

  IF v_envelope IS NULL THEN
    COMMIT;
    SELECT 'not_found' AS result;
  ELSEIF v_method <> 'wet_ink' THEN
    COMMIT;
    SELECT 'wrong_method' AS result;
  ELSEIF v_status <> 'pending' THEN
    COMMIT;
    SELECT 'not_pending' AS result;
  ELSE
    UPDATE legal_signatories
       SET status = 'signed', signed_at = NOW(), executed_copy_path = p_path, updated_at = NOW()
     WHERE id = p_signatory;

    INSERT INTO legal_signature_events
      (id, envelope_id, signatory_id, actor_kind, actor_id, kind, detail, created_at)
    VALUES
      (UUID(), v_envelope, p_signatory, 'customer', p_actor, 'wet_ink_signature_recorded',
       JSON_OBJECT('path', p_path), NOW());

    COMMIT;
    SELECT 'ok' AS result;
  END IF;
END
SQL,

            /*
             * Complete an envelope once every signatory has signed.
             *
             * The digital route additionally requires each signatory to carry a
             * certificate that is currently `verified`. Since no adapter to a Nepali
             * certifying authority is implemented, no certificate can reach that state,
             * so a digital envelope cannot complete — enforced here so the guarantee
             * does not depend on the UI being correct.
             */
            'legal_complete_envelope' => <<<'SQL'
CREATE PROCEDURE `legal_complete_envelope`(IN p_envelope CHAR(36), IN p_actor INT UNSIGNED)
BEGIN
  DECLARE v_method       VARCHAR(32) DEFAULT NULL;
  DECLARE v_status       VARCHAR(16) DEFAULT NULL;
  DECLARE v_pending      INT DEFAULT 0;
  DECLARE v_uncertified  INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT method, status INTO v_method, v_status
    FROM legal_signature_envelopes WHERE id = p_envelope FOR UPDATE;

  IF v_status IS NULL THEN
    COMMIT;
    SELECT 'not_found' AS result;
  ELSEIF v_status = 'completed' THEN
    COMMIT;
    SELECT 'ok' AS result;
  ELSEIF v_status = 'voided' THEN
    COMMIT;
    SELECT 'voided' AS result;
  ELSE
    SELECT COUNT(*) INTO v_pending
      FROM legal_signatories WHERE envelope_id = p_envelope AND status <> 'signed';

    IF v_pending > 0 THEN
      COMMIT;
      SELECT 'incomplete' AS result;
    ELSE
      IF v_method = 'digital_certificate' THEN
        SELECT COUNT(*) INTO v_uncertified
          FROM legal_signatories s
          LEFT JOIN legal_certificates c ON c.id = s.certificate_id
         WHERE s.envelope_id = p_envelope
           AND (c.id IS NULL OR c.status <> 'verified');
      END IF;

      IF v_uncertified > 0 THEN
        COMMIT;
        SELECT 'certificate_not_verified' AS result;
      ELSE
        UPDATE legal_signature_envelopes
           SET status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = p_envelope AND status <> 'completed';

        INSERT INTO legal_signature_events
          (id, envelope_id, actor_kind, actor_id, kind, detail, created_at)
        VALUES
          (UUID(), p_envelope, 'customer', p_actor, 'envelope_completed',
           JSON_OBJECT('method', v_method), NOW());

        COMMIT;
        SELECT 'ok' AS result;
      END IF;
    END IF;
  END IF;
END
SQL,

            /*
             * Attach a Bagisto admin account to the advocate record with the same email.
             *
             * Sign-in is by the firm's staff login, so a mistyped domain does not error.
             * It simply never matches, and the advocate opens an empty desk with nothing
             * on screen to explain why.
             */
            'legal_link_advocate_account' => <<<'SQL'
CREATE PROCEDURE `legal_link_advocate_account`(IN p_admin INT UNSIGNED, IN p_email VARCHAR(255))
BEGIN
  DECLARE v_id CHAR(36) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  SELECT id INTO v_id FROM legal_advocates WHERE admin_id = p_admin;

  IF v_id IS NULL THEN
    UPDATE legal_advocates
       SET admin_id = p_admin, updated_at = NOW()
     WHERE LOWER(email) = LOWER(p_email) AND admin_id IS NULL;

    SELECT id INTO v_id FROM legal_advocates WHERE admin_id = p_admin;
  END IF;

  SELECT v_id AS result;
END
SQL,

            /*
             * Answer a matter.
             *
             * Refuses anything not assigned to the caller, and anything not in
             * 'assigned' — an enquiry still in 'screening' has no question attached yet,
             * so there is nothing to answer. Locked so two advocates cannot both answer
             * the same matter.
             */
            'legal_answer_enquiry' => <<<'SQL'
CREATE PROCEDURE `legal_answer_enquiry`(
  IN p_enquiry CHAR(36),
  IN p_admin   INT UNSIGNED,
  IN p_answer  TEXT
)
BEGIN
  DECLARE v_advocate CHAR(36) DEFAULT NULL;
  DECLARE v_assigned CHAR(36) DEFAULT NULL;
  DECLARE v_status   VARCHAR(16) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

  START TRANSACTION;

  SELECT id INTO v_advocate FROM legal_advocates WHERE admin_id = p_admin;

  IF v_advocate IS NULL THEN
    COMMIT;
    SELECT 'not_an_advocate' AS result;
  ELSE
    SELECT advocate_id, status INTO v_assigned, v_status
      FROM legal_enquiries WHERE id = p_enquiry FOR UPDATE;

    IF v_status IS NULL THEN
      COMMIT;
      SELECT 'not_found' AS result;
    ELSEIF v_assigned IS NULL OR v_assigned <> v_advocate THEN
      COMMIT;
      SELECT 'not_assigned_to_you' AS result;
    ELSEIF v_status <> 'assigned' THEN
      COMMIT;
      SELECT 'not_answerable' AS result;
    ELSE
      UPDATE legal_enquiries
         SET answer = p_answer, status = 'answered', answered_at = NOW(), updated_at = NOW()
       WHERE id = p_enquiry;
      COMMIT;
      SELECT 'ok' AS result;
    END IF;
  END IF;
END
SQL,
        ];
    }
};
