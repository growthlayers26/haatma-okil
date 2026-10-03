<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Makes a gateway's own transaction reference spendable at most once.
 *
 * Both eSewa and Fonepay confirm a payment by redirecting the browser back with a
 * signed, verifiable result — but a signed result is proof money moved once, not
 * proof it has not been shown to this endpoint before. Neither controller checked
 * that before creating an order: whoever holds one genuine successful redirect (a
 * browser-history entry, a leaked URL, a payment on their own account) could replay
 * it against a fresh cart totalling the same amount and mint a second, unpaid order
 * — the signature still verifies, and eSewa's status endpoint still reports the
 * original transaction as COMPLETE, because eSewa has no idea the merchant already
 * fulfilled it once.
 *
 * The unique index on (gateway, transaction_ref) is what actually closes this: the
 * INSERT below happens once per controller, after signature and amount verification
 * but before the order is created, and a second attempt at the same reference fails
 * the constraint rather than reaching OrderRepository::create().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_payment_confirmations', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', 20);
            // eSewa's transaction_uuid or Fonepay's PRN. Long enough for either.
            $table->string('transaction_ref', 191);
            $table->unsignedInteger('order_id')->nullable();
            $table->dateTime('created_at');

            $table->unique(['gateway', 'transaction_ref']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_payment_confirmations');
    }
};
