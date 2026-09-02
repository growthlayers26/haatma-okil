<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Put the firm's name on the shop.
 *
 * A fresh Bagisto ships as "Demo store" — it is the browser tab title and the meta
 * title on every storefront page. Clients are sent here to pay for legal work, and
 * arriving at a page titled "Demo store" reads as either the wrong site or an
 * unfinished one. Neither is a good first impression when someone is about to hand
 * over money for a contract.
 *
 * The name is written once here rather than read from lib/firm.ts. That is a
 * deliberate duplication and a small one: unlike the price list, a store name is not
 * something that drifts, and the firm will want to edit this in the admin panel
 * alongside the rest of their storefront copy. Anything they change there survives —
 * this only runs once.
 */
return new class extends Migration
{
    private const NAME_EN = 'Haatma Okil';

    private const NAME_NE = 'हातमा वकिल';

    public function up(): void
    {
        $description = 'Nepali legal documents, drafted against the statute they come from '
            .'and reviewed by Nepal Bar Council registered advocates.';

        foreach (DB::table('channel_translations')->get() as $translation) {
            $seo = json_decode((string) $translation->home_seo, true);
            $seo = is_array($seo) ? $seo : [];

            // Only replace Bagisto's own placeholder text. If the firm has already
            // written their own title, leave it alone.
            if (! isset($seo['meta_title']) || str_contains((string) $seo['meta_title'], 'Demo store')) {
                $seo['meta_title'] = self::NAME_EN.' — '.self::NAME_NE;
            }

            if (! isset($seo['meta_description']) || str_contains((string) $seo['meta_description'], 'Demo store')) {
                $seo['meta_description'] = $description;
            }

            if (! isset($seo['meta_keywords']) || str_contains((string) $seo['meta_keywords'], 'Demo store')) {
                $seo['meta_keywords'] = 'legal documents, Nepal, advocate, contract';
            }

            DB::table('channel_translations')
                ->where('id', $translation->id)
                ->update([
                    'name'     => in_array($translation->locale, ['ne', 'np'], true)
                        ? self::NAME_NE
                        : self::NAME_EN,
                    'home_seo' => json_encode($seo, JSON_UNESCAPED_UNICODE),
                ]);
        }
    }

    public function down(): void
    {
        // Not reversed. Putting "Demo store" back on a live law firm's shop is not a
        // rollback anyone wants, and the firm's own edits would be lost with it.
    }
};
