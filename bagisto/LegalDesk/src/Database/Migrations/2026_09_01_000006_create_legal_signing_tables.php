<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Signing: certificates, envelopes, signatories and the audit trail.
 *
 * Two routes exist. Wet ink is the one that works today — parties print, sign and
 * upload the executed copy. The digital route requires a certificate issued by an
 * authority licensed under the Electronic Transactions Act 2063, and no adapter to
 * any Nepali certifying authority is implemented, so nothing reaches `verified` and
 * complete_envelope refuses to finish that route. That is the correct behaviour
 * today, not an oversight.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * A signing certificate held by a customer.
         *
         * `ca_licence_ref` records WHICH licensed authority issued it. That is the
         * fact the Act turns on, so it belongs in the audit trail rather than being
         * inferred from a name at display time.
         */
        Schema::create('legal_certificates', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');
            $table->string('ca_name');
            $table->string('ca_licence_ref')->nullable();
            $table->string('subject_common_name');
            $table->string('serial_number');
            $table->dateTime('valid_from')->nullable();
            $table->dateTime('valid_to')->nullable();
            $table->enum('status', ['unverified', 'verified', 'revoked', 'expired'])->default('unverified');
            $table->dateTime('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->unique(['ca_name', 'serial_number']);
        });

        Schema::create('legal_signature_envelopes', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('document_id', 36);
            $table->unsignedInteger('created_by');
            $table->char('org_id', 36)->nullable();
            $table->enum('method', ['wet_ink', 'digital_certificate'])->default('wet_ink');
            $table->enum('status', ['draft', 'sent', 'completed', 'voided'])->default('draft');
            $table->string('subject');
            $table->text('message')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('document_id')->references('id')->on('legal_documents')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('org_id')->references('id')->on('legal_organisations')->onDelete('set null');

            $table->index('document_id');
            $table->index(['created_by', 'created_at']);
        });

        Schema::create('legal_signatories', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('envelope_id', 36);
            $table->string('full_name');
            $table->string('email')->nullable();
            // The capacity in which they sign — "Director", "Witness", "Tenant".
            $table->string('capacity')->nullable();
            $table->unsignedInteger('order_index')->default(0);
            $table->enum('status', ['pending', 'signed', 'declined'])->default('pending');
            /*
             * Set on the digital route only. A signature with no certificate behind it
             * is not a recognised digital signature, which is exactly why this is
             * nullable and why complete_envelope refuses to finish without it.
             */
            $table->char('certificate_id', 36)->nullable();
            // Set on the wet-ink route: where the scanned executed copy lives.
            $table->string('executed_copy_path')->nullable();
            $table->dateTime('signed_at')->nullable();
            $table->text('declined_reason')->nullable();
            $table->timestamps();

            $table->foreign('envelope_id')->references('id')->on('legal_signature_envelopes')->onDelete('cascade');
            $table->foreign('certificate_id')->references('id')->on('legal_certificates')->onDelete('set null');

            $table->index(['envelope_id', 'order_index']);
            // A signatory sees their envelope by verified email address.
            $table->index('email');
        });

        /*
         * The audit trail. Append-only by intent: nothing in the application updates
         * or deletes a row here, so if a signature is later disputed the value of this
         * record lies in nobody having been able to edit it after the fact —
         * including the firm.
         */
        Schema::create('legal_signature_events', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('envelope_id', 36);
            $table->char('signatory_id', 36)->nullable();
            // Either a customer or an admin may act; recorded as free text plus id so
            // the trail survives the account being deleted.
            $table->string('actor_kind')->nullable();
            $table->unsignedInteger('actor_id')->nullable();
            $table->string('kind');
            $table->json('detail');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('envelope_id')->references('id')->on('legal_signature_envelopes')->onDelete('cascade');
            $table->foreign('signatory_id')->references('id')->on('legal_signatories')->onDelete('set null');

            $table->index(['envelope_id', 'created_at']);
        });

        foreach ([
            'legal_certificates',
            'legal_signature_envelopes',
            'legal_signatories',
            'legal_signature_events',
        ] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_signature_events');
        Schema::dropIfExists('legal_signatories');
        Schema::dropIfExists('legal_signature_envelopes');
        Schema::dropIfExists('legal_certificates');
    }
};
