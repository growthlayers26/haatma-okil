<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Only offer payment methods this firm can actually settle through.
 *
 * Checkout showed nine payment methods, but only eSewa and Fonepay are gateways
 * this firm actually built and can settle Nepali money through. Stripe and both
 * PayPal methods are kept active deliberately — for a client paying from abroad,
 * not Nepal, and worth leaving visible even though (like every method here) they
 * currently run on placeholder test credentials rather than a funded merchant
 * account. Razorpay, PayU, PhonePe, Cash On Delivery and Money Transfer serve no
 * one this firm has a way to accept money from and are disabled: each one only
 * appeared because its package ships `active => true` with placeholder test
 * credentials that happen to satisfy its own hasValidCredentials() check, and a
 * customer picking one would reach a dead end.
 *
 * Written to core_config rather than each package's own config file — this is the
 * same override an admin flipping "Disabled" in Configure > Sales > Payment Methods
 * would produce, so it is visible and reversible from the admin panel rather than
 * a code change the firm would have to ask an engineer to undo.
 */
return new class extends Migration
{
    private const DISABLE = [
        'razorpay',
        'phonepe',
        'cashondelivery',
        'moneytransfer',
        'payu',
    ];

    public function up(): void
    {
        /*
         * Each payment method's `active` flag is declared channel_based in
         * Webkul\Admin's system.php, so SystemConfig::getCoreConfig() looks it
         * up by an exact channel_code match — a row with channel_code NULL is
         * simply never found, and silently falls through to the package's own
         * `active => true` default. Every channel needs its own row.
         */
        $channelCodes = DB::table('channels')->pluck('code');

        foreach ($channelCodes as $channelCode) {
            foreach (self::DISABLE as $code) {
                $path = "sales.payment_methods.{$code}.active";

                $exists = DB::table('core_config')
                    ->where('channel_code', $channelCode)
                    ->whereNull('locale_code')
                    ->where('code', $path)
                    ->exists();

                if ($exists) {
                    DB::table('core_config')
                        ->where('channel_code', $channelCode)
                        ->whereNull('locale_code')
                        ->where('code', $path)
                        ->update(['value' => '0', 'updated_at' => now()]);
                } else {
                    DB::table('core_config')->insert([
                        'code'         => $path,
                        'channel_code' => $channelCode,
                        'locale_code'  => null,
                        'value'        => '0',
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('core_config')
            ->whereIn('code', array_map(
                fn (string $code) => "sales.payment_methods.{$code}.active",
                self::DISABLE,
            ))
            ->delete();
    }
};
