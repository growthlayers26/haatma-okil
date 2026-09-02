<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Make the shop sell in rupees.
 *
 * Bagisto installs with USD as the only currency, and the catalogue seeder writes the
 * firm's price list in as plain numbers — so a NPR 599 employment contract was offered
 * at $599, roughly a hundred and thirty times its price. Nothing about that failed
 * loudly: the checkout rendered a perfectly ordinary dollar figure.
 *
 * Idempotent, so it is safe on a store that already has NPR.
 *
 * Note what is NOT attempted here. Nepali money is grouped in lakhs — १,००,००० rather
 * than 100,000 — and Bagisto's `group_separator` is a single repeating separator that
 * cannot express that. The application renders its own prices correctly through
 * formatNpr() in lib/nepal.ts; the shop will group in thousands. Making Bagisto group
 * in lakhs means overriding its formatter, which is a real piece of work and a
 * separate decision from being in the right currency at all.
 */
return new class extends Migration
{
    public function up(): void
    {
        $currency = DB::table('currencies')->where('code', 'NPR')->first();

        if (! $currency) {
            DB::table('currencies')->insert([
                'code'               => 'NPR',
                'name'               => 'Nepali Rupee',
                // The Devanagari abbreviation, which is what appears on a Nepali price.
                'symbol'             => 'रू',
                'decimal'            => 2,
                'decimal_separator'  => '.',
                'group_separator'    => ',',
                'currency_position'  => 'left',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            $currency = DB::table('currencies')->where('code', 'NPR')->first();
        }

        foreach (DB::table('channels')->get() as $channel) {
            DB::table('channels')
                ->where('id', $channel->id)
                ->update(['base_currency_id' => $currency->id]);

            // The pivot decides what a shopper may switch to. Without a row here the
            // channel has a base currency it does not actually offer.
            $linked = DB::table('channel_currencies')
                ->where('channel_id', $channel->id)
                ->where('currency_id', $currency->id)
                ->exists();

            if (! $linked) {
                DB::table('channel_currencies')->insert([
                    'channel_id'  => $channel->id,
                    'currency_id' => $currency->id,
                ]);
            }
        }
    }

    public function down(): void
    {
        /*
         * Deliberately not reversed.
         *
         * Rolling the currency back to USD would silently re-price the whole catalogue
         * a hundredfold, which is worse than leaving a store in the currency it trades
         * in. Removing NPR is a decision to make by hand, with the catalogue in view.
         */
    }
};
