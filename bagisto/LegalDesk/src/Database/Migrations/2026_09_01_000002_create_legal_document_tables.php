<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Documents, and what a paid order entitles someone to.
 *
 * Clause text is not here. It lives in version-controlled TypeScript, so legal
 * content stays under review in git rather than drifting inside a database. What is
 * stored is what the person answered.
 *
 * `legal_entitlements` replaces the old `orders` table. Bagisto now owns orders,
 * invoices, gateways and amounts, and keeping a parallel copy would create two
 * answers to "was this paid for". What Bagisto cannot know is what a payment buys in
 * legal terms, so that is all this table records: one row per purchased unit, spent
 * once, pointing back at the Bagisto order that paid for it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');
            $table->string('template_slug');
            // Pin the template version the answers were given against, so a later
            // amendment is detectable rather than silently changing what was bought.
            $table->string('template_version')->default('v1');
            $table->json('answers');
            $table->enum('status', ['draft', 'purchased'])->default('draft');

            // Approval, for documents drafted inside an organisation.
            $table->char('org_id', 36)->nullable();
            $table->enum('approval_status', ['not_required', 'pending', 'approved', 'rejected'])
                ->default('not_required');
            $table->unsignedInteger('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->text('review_note')->nullable();

            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('org_id')->references('id')->on('legal_organisations')->onDelete('set null');
            $table->foreign('approved_by')->references('id')->on('customers')->onDelete('set null');

            $table->index(['customer_id', 'updated_at']);
            // Drives the amendment alert: who holds a document from this template.
            $table->index(['template_slug', 'template_version']);
            $table->index(['org_id', 'approval_status']);
        });

        Schema::create('legal_entitlements', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');
            // The Bagisto order that paid for this. Null only for entitlements the
            // firm grants by hand from the admin panel.
            $table->unsignedInteger('bagisto_order_id')->nullable();
            /*
             * The order line, and which unit of that line this is.
             *
             * Both exist so that redemption can be idempotent without collapsing
             * quantity: someone buying three reviews in one order gets three rows,
             * and re-running redemption creates none of them twice.
             */
            $table->unsignedInteger('order_item_id')->nullable();
            $table->unsignedInteger('seq')->default(0);
            /*
             * What was bought. 'document' unlocks one draft; 'review', 'question',
             * 'consultation' and 'filing' are single spends; 'subscription' is
             * redeemed into legal_subscriptions.
             */
            $table->enum('kind', [
                'document', 'review', 'question', 'consultation', 'filing', 'subscription',
            ]);
            /*
             * The exact service, where `kind` alone is too coarse.
             *
             * Company registration, trademark and tax registration are all 'filing'
             * and cost between NPR 9,999 and 12,999 — they are emphatically not
             * interchangeable with each other, so claiming one has to match on this
             * rather than on the kind.
             */
            $table->string('service_id')->nullable();
            $table->char('document_id', 36)->nullable();
            // Set when spent. Claimed before the work and handed back if the work
            // fails, so nobody pays for an analysis that errored.
            $table->dateTime('consumed_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('bagisto_order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('document_id')->references('id')->on('legal_documents')->onDelete('set null');

            // One entitlement per unit of an order line. Gateways retry and an order
            // may be swept more than once, so redemption must be idempotent.
            $table->unique(['bagisto_order_id', 'order_item_id', 'seq'], 'legal_entitlements_line_unique');
            $table->index(['customer_id', 'kind', 'consumed_at']);
        });

        Schema::create('legal_org_templates', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('org_id', 36);
            // Must correspond to a slug in the code registry. Enforced in the server
            // action, since this database has no knowledge of lib/templates.
            $table->string('base_slug');
            $table->string('name');
            // Values pre-filled for whoever starts from this overlay.
            $table->json('default_answers');
            // Extra clauses appended after the base clauses. Never replace one.
            $table->json('extra_clauses');
            $table->unsignedInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('legal_organisations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('customers')->onDelete('set null');

            $table->unique(['org_id', 'name']);
        });

        foreach (['legal_documents', 'legal_entitlements', 'legal_org_templates'] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_org_templates');
        Schema::dropIfExists('legal_entitlements');
        Schema::dropIfExists('legal_documents');
    }
};
