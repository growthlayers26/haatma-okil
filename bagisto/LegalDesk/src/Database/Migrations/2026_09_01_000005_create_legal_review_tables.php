<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Contract review results.
 *
 * Note what is absent: the document text. The model extracts facts and the findings
 * are written by deterministic rules in TypeScript, so what is stored is the
 * classification and the observations — never the contract someone uploaded.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_reviews', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');

            $table->string('document_type');
            $table->json('facts');
            $table->json('findings');

            // Denormalised counts so the dashboard need not parse the findings array.
            $table->unsignedInteger('breach_count')->default(0);
            $table->unsignedInteger('missing_count')->default(0);
            $table->unsignedInteger('check_count')->default(0);

            // Whether the subscriber's monthly allowance covered this review.
            $table->boolean('covered_by_plan')->default(false);
            // The paid entitlement spent on it, when the allowance did not cover it.
            $table->char('entitlement_id', 36)->nullable();

            /*
             * Set when the customer escalates the review into a matter with an
             * advocate. This is the point of the whole feature: findings are
             * questions, and an advocate answers.
             */
            $table->char('enquiry_id', 36)->nullable();

            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('entitlement_id')->references('id')->on('legal_entitlements')->onDelete('set null');
            $table->foreign('enquiry_id')->references('id')->on('legal_enquiries')->onDelete('set null');

            $table->index(['customer_id', 'created_at']);
        });

        DB::statement('ALTER TABLE `legal_reviews` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())');
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_reviews');
    }
};
