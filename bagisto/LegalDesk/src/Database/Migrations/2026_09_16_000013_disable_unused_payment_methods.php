<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Only offer the two gateways that actually work.
 *
 * Bagisto's checkout showed nine payment methods before this — Stripe, Razorpay,
 * PayU, PhonePe, both PayPal variants, Cash On Delivery and Money Transfer — every
 * one of them "available" only because its package ships `active => true` with
 * placeholder test credentials that happen to satisfy its own hasValidCredentials()
 * check. None of them settle real money for this firm; eSewa and Fonepay are the
 * only two gateways actually built to. A customer picking any of the other seven
 * would reach a dead end at best.
 *
 * Written to core_config rather than each package's own config file — this is the
 * same override an admin flipping "Disabled" in Configure > Sales > Payment Methods
 * would produce, so it is visible and reversible from the admin panel rather than
 * a code change the firm would have to ask an engineer to undo.
 */
return new class extends Migration
{
    private const DISABLE = [
        'stripe',
        'razorpay',
        'phonepe',
        'paypal_smart_button',
        'paypal_standard',
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
