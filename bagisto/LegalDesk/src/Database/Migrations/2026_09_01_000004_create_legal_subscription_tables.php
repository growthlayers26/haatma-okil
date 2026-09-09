<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Subscriptions and the monthly allowance they carry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_subscriptions', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            // One subscription per customer. A renewal extends this row rather than
            // adding one.
            $table->unsignedInteger('customer_id')->unique();
            $table->enum('plan_id', ['free', 'business', 'enterprise']);
            $table->enum('billing_period', ['monthly', 'annual']);
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');

            /*
             * Entitlement snapshot, taken from lib/plans.ts at activation.
             *
             * Deliberately copied rather than looked up. If the firm later changes
             * what a Business plan includes, existing subscribers keep what they
             * actually bought until their next renewal — changing it under them would
             * be a straightforward breach of the deal they paid for.
             */
            $table->unsignedInteger('questions_per_month')->default(0);
            $table->unsignedInteger('reviews_per_month')->default(0);
            $table->unsignedInteger('seats')->default(1);

            $table->dateTime('current_period_start');
            $table->dateTime('current_period_end');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->index(['customer_id', 'status', 'current_period_end']);
        });

        /*
         * One row per consumed unit, rather than a counter decremented in place.
         *
         * A counter tells you what is left; these rows tell you what was taken and
         * when, which is what you need when a subscriber disputes their usage. It also
         * makes the consumption check a COUNT under a row lock, which is
         * straightforward to reason about — see consume_quota.
         */
        Schema::create('legal_quota_usage', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('subscription_id', 36);
            $table->unsignedInteger('customer_id');
            $table->enum('kind', ['question', 'review']);
            $table->char('enquiry_id', 36)->nullable();
            // The calendar month this consumption counted against.
            $table->dateTime('period_start');
            $table->dateTime('consumed_at')->useCurrent();

            $table->foreign('subscription_id')->references('id')->on('legal_subscriptions')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('enquiry_id')->references('id')->on('legal_enquiries')->onDelete('set null');

            $table->index(['subscription_id', 'kind', 'period_start']);
        });

        foreach (['legal_subscriptions', 'legal_quota_usage'] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_quota_usage');
        Schema::dropIfExists('legal_subscriptions');
    }
};
