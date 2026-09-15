<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Proves who is buying before legal/buy/{sku} touches a cart.
 *
 * The application's sign-in and Bagisto's are two separate sessions on one shared
 * account. Left unchecked, whatever Bagisto session happens to be active in the
 * browser — stale, or another customer's entirely — is the one the checkout would
 * use. This table is what CheckoutController checks instead: one row per hand-off,
 * minted by the application the instant it redirects the browser here, spent at
 * most once, and worthless within minutes even if it ends up in a server log or
 * browser history. Only the hash of the token is stored.
 *
 * Rows are never purged. One per checkout attempt is small enough that this has
 * not needed a cleanup job.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_checkout_handoffs', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedInteger('customer_id');
            $table->char('token_hash', 64)->unique();
            // The item the application minted this for. Not consulted to decide what
            // goes in the cart — the SKU in the URL still does that — kept only so a
            // handoff row is legible on its own when something needs debugging.
            $table->string('sku');
            $table->dateTime('expires_at');
            $table->dateTime('used_at')->nullable();
            $table->dateTime('created_at');

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        DB::statement("ALTER TABLE `legal_checkout_handoffs` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_checkout_handoffs');
    }
};
