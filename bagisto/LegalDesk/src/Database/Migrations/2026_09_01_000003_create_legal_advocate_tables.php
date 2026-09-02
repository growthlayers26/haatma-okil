<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The advocate desk.
 *
 * The firm has three practising advocates. This is not a tiered support desk: all
 * three are licensed counsel, and an enquiry is assigned to one of them rather than
 * escalated between them.
 *
 * An advocate links to a Bagisto **admin** account, not a customer — they are firm
 * staff, and this is what finally closes a real gap in the old schema, where
 * `advocates.user_id` existed but nothing could ever set it, so no advocate could
 * open an enquiry. Bagisto's admin panel is now their way in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_advocates', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            // The staff account this advocate signs in with.
            $table->unsignedInteger('admin_id')->nullable()->unique();
            $table->string('full_name_ne');
            $table->string('full_name_en');
            $table->string('email')->nullable()->unique();
            /*
             * Nepal Bar Council licence. Left null deliberately. The numbers exist on
             * each advocate's licence certificate and belong here eventually — when a
             * client later disputes advice, the record of which licensed advocate
             * gave it is what the firm needs — but an absent number blocks nothing
             * and a placeholder would mislead.
             */
            $table->string('nbc_licence')->nullable();
            $table->string('photo_path')->nullable();
            // Practice areas this advocate takes. Matched against enquiries.area_of_law.
            $table->json('practice_areas');
            $table->boolean('active')->default(true);
            // Cap on concurrent open matters, so routing stops overloading one advocate.
            $table->unsignedInteger('capacity')->default(20);
            $table->timestamps();

            $table->foreign('admin_id')->references('id')->on('admins')->onDelete('set null');
        });

        Schema::create('legal_enquiries', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');
            $table->char('document_id', 36)->nullable();
            $table->char('advocate_id', 36)->nullable();

            $table->enum('kind', ['question', 'consultation', 'document_review'])->default('question');
            $table->string('area_of_law');

            /*
             * Collected and cleared BEFORE the matter is described, so a conflicted
             * enquiry is refused before privileged detail enters the system.
             * `question` stays null until conflict_cleared_at is set.
             */
            $table->string('opposing_party')->nullable();
            $table->dateTime('conflict_cleared_at')->nullable();
            $table->text('question')->nullable();

            $table->enum('status', ['screening', 'assigned', 'answered', 'declined'])
                ->default('screening');
            $table->text('answer')->nullable();
            $table->dateTime('answered_at')->nullable();
            // One working day for a written question; consultations are booked separately.
            $table->dateTime('due_at')->nullable();

            /*
             * Whether this matter was covered by the subscriber's monthly allowance or
             * billed per matter. Recorded on the enquiry rather than inferred later,
             * because the allowance is consumed at intake and the answer must not
             * change retroactively when a subscription lapses or renews.
             */
            $table->boolean('covered_by_plan')->default(false);
            /*
             * The paid entitlement spent on this matter, when the allowance did not
             * cover it. A practice has to be able to show what was charged for what,
             * and "covered_by_plan = false" only says the allowance did not pay —
             * not that anything else did.
             */
            $table->char('entitlement_id', 36)->nullable();

            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('document_id')->references('id')->on('legal_documents')->onDelete('set null');
            $table->foreign('advocate_id')->references('id')->on('legal_advocates')->onDelete('set null');
            $table->foreign('entitlement_id')->references('id')->on('legal_entitlements')->onDelete('set null');

            $table->index(['customer_id', 'created_at']);
            $table->index(['advocate_id', 'status', 'due_at']);
        });

        foreach (['legal_advocates', 'legal_enquiries'] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        }

        /*
         * The firm's three advocates.
         *
         * DEVANAGARI SPELLING STILL NEEDS CONFIRMATION. These are the conventional
         * transliterations, but a person's own spelling — as it appears on their
         * citizenship certificate and Bar Council licence — is the authoritative one,
         * and Nepali personal names vary in ways transliteration rules do not capture.
         * In particular "Bishnu" is written both विष्णु (Sanskritic) and बिष्णु (common
         * in Nepali personal names); the second is used here as the more usual spelling
         * for a given name, but confirm it.
         *
         * All three practise across every area, so assign_advocate routes purely on
         * caseload.
         */
        $areas = json_encode(['employment', 'property', 'business', 'family', 'other']);

        foreach ([
            ['बिष्णु प्रकाश मणि', 'Bishnu Prakash Mani', 'bishnu@haatmaokil.com', '/advocates/bishnu-prakash-mani.jpg'],
            ['प्रताप रत्न श्रेष्ठ', 'Pratap Ratna Shrestha', 'pratap@haatmaokil.com', '/advocates/pratap-ratna-shrestha.jpg'],
            ['प्रश्रय दाहाल', 'Prashray Dahal', 'prashray@haatmaokil.com', null],
        ] as [$ne, $en, $email, $photo]) {
            DB::table('legal_advocates')->insertOrIgnore([
                'full_name_ne'   => $ne,
                'full_name_en'   => $en,
                'email'          => $email,
                'photo_path'     => $photo,
                'practice_areas' => $areas,
                'active'         => true,
                'capacity'       => 20,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_enquiries');
        Schema::dropIfExists('legal_advocates');
    }
};
