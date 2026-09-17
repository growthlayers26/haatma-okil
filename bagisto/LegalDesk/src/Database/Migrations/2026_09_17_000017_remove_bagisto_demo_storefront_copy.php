<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Three more pieces of Bagisto's own demo content were still live on the
 * storefront, none of them touched by the earlier theme_customizations or
 * payment-method cleanups because none of them go through those systems:
 *
 * - The header announcement bar ("Get UPTO 40% OFF on your 1st order — SHOP NOW")
 *   is core_config (general.content.header_offer.*), not a theme customization —
 *   and there is no real offer, so this clears it rather than inventing one. A law
 *   firm's own site claiming a discount that doesn't exist is worse than an empty
 *   bar.
 * - The footer copyright line falls back, when general.content.footer.copyright_content
 *   is unset, to Bagisto's own package default: "Webkul Software (Registered in
 *   India)" — crediting the storefront to its vendor instead of the firm whose site
 *   it is. This sets the real copyright line.
 * - The newsletter block's "Get Ready for our Fun Newsletter!" text has no
 *   core_config override at all — it's a hardcoded lang string shown whenever
 *   customer.settings.newsletter.subscription is on. The firm has no newsletter, so
 *   this turns the feature off rather than rewording copy for something that
 *   doesn't exist; collecting emails for a newsletter that isn't real would be
 *   worse than the bar/footer issues above.
 *
 * Each field's scoping has to match its own definition in
 * Webkul\Admin\Config\system.php or CoreConfigRepository::findOneWhere() simply
 * never matches the row (same class of bug as the payment-methods migration, but
 * the other direction here): header_offer.* and newsletter.subscription are
 * channel-scoped (one row per real channel_code, locale_code NULL), while
 * footer.copyright_content is declared `'channel_based' => false, 'locale_based' =>
 * true` — its row needs channel_code NULL and a real locale_code instead. Verified
 * both shapes against core()->getConfigData() in tinker before deploying.
 *
 * The copyright value is written as the `&copy;` entity rather than the literal ©
 * character — the footer renders it unescaped ({!! !!}), so the entity displays
 * identically, without depending on every hop (this file, scp, the MySQL
 * connection's charset) preserving a raw multibyte character correctly.
 */
return new class extends Migration
{
    private const CHANNEL_SCOPED = [
        'general.content.header_offer.title' => '',
        'general.content.header_offer.redirection_title' => '',
        'general.content.header_offer.redirection_link' => '',
        'customer.settings.newsletter.subscription' => '0',
    ];

    private const LOCALE_SCOPED = [
        'general.content.footer.copyright_content' => '&copy; Haatma Okil. All rights reserved.',
    ];

    public function up(): void
    {
        $channelCodes = DB::table('channels')->pluck('code');
        $localeCodes = DB::table('locales')->pluck('code');

        foreach ($channelCodes as $channelCode) {
            foreach (self::CHANNEL_SCOPED as $path => $value) {
                $this->upsert($path, $value, $channelCode, null);
            }
        }

        foreach ($localeCodes as $localeCode) {
            foreach (self::LOCALE_SCOPED as $path => $value) {
                $this->upsert($path, $value, null, $localeCode);
            }
        }
    }

    public function down(): void
    {
        DB::table('core_config')
            ->whereIn('code', [...array_keys(self::CHANNEL_SCOPED), ...array_keys(self::LOCALE_SCOPED)])
            ->delete();
    }

    private function upsert(string $path, string $value, ?string $channelCode, ?string $localeCode): void
    {
        $query = DB::table('core_config')
            ->where('code', $path)
            ->where(fn ($q) => $channelCode ? $q->where('channel_code', $channelCode) : $q->whereNull('channel_code'))
            ->where(fn ($q) => $localeCode ? $q->where('locale_code', $localeCode) : $q->whereNull('locale_code'));

        if ($query->exists()) {
            $query->update(['value' => $value, 'updated_at' => now()]);
        } else {
            DB::table('core_config')->insert([
                'code' => $path,
                'channel_code' => $channelCode,
                'locale_code' => $localeCode,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
