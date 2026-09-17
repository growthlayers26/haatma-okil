<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * All ten of Bagisto's seed CMS pages were still live at their real URLs
 * (/about-us, /privacy-policy, /shipping-policy, ...) with their entire content
 * being the placeholder Bagisto ships each page with — literally the text
 * "About Us Page Content", "Shipping Policy Page Content", and so on. Several of
 * them (Shipping Policy, Return Policy, Refund Policy, What's New) describe a
 * physical-goods retailer and don't apply to a digital legal-document service at
 * all.
 *
 * cms_pages has no status/enabled column — Bagisto's CMS pages are reachable
 * whenever the row exists, full stop — so "hidden" here means removed rather than
 * disabled. down() restores the exact rows this deletes, including the original
 * placeholder content, so nothing is lost if any of these need to come back before
 * the firm has real copy for them.
 */
return new class extends Migration
{
    private const PAGES = [
        ['id' => 1, 'title' => 'About Us', 'url_key' => 'about-us', 'meta_title' => 'about us', 'meta_keywords' => 'aboutus'],
        ['id' => 2, 'title' => 'Return Policy', 'url_key' => 'return-policy', 'meta_title' => 'return policy', 'meta_keywords' => 'return, policy'],
        ['id' => 3, 'title' => 'Refund Policy', 'url_key' => 'refund-policy', 'meta_title' => 'Refund policy', 'meta_keywords' => 'refund, policy'],
        ['id' => 4, 'title' => 'Terms & Conditions', 'url_key' => 'terms-conditions', 'meta_title' => 'Terms & Conditions', 'meta_keywords' => 'term, conditions'],
        ['id' => 5, 'title' => 'Terms of Use', 'url_key' => 'terms-of-use', 'meta_title' => 'Terms of use', 'meta_keywords' => 'term, use'],
        ['id' => 6, 'title' => 'Customer Service', 'url_key' => 'customer-service', 'meta_title' => 'Customer Service', 'meta_keywords' => 'customer, service'],
        ['id' => 7, 'title' => "What's New", 'url_key' => 'whats-new', 'meta_title' => "What's New", 'meta_keywords' => 'new', 'content_suffix' => 'page content'],
        ['id' => 8, 'title' => 'Payment Policy', 'url_key' => 'payment-policy', 'meta_title' => 'Payment Policy', 'meta_keywords' => 'payment, policy'],
        ['id' => 9, 'title' => 'Shipping Policy', 'url_key' => 'shipping-policy', 'meta_title' => 'Shipping Policy', 'meta_keywords' => 'shipping, policy'],
        ['id' => 10, 'title' => 'Privacy Policy', 'url_key' => 'privacy-policy', 'meta_title' => 'Privacy Policy', 'meta_keywords' => 'privacy, policy'],
    ];

    public function up(): void
    {
        $ids = array_column(self::PAGES, 'id');

        DB::table('cms_page_translations')->whereIn('cms_page_id', $ids)->delete();
        DB::table('cms_pages')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        foreach (self::PAGES as $page) {
            DB::table('cms_pages')->insert([
                'id' => $page['id'],
                'layout' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $contentLabel = $page['content_suffix'] ?? 'Page Content';

            DB::table('cms_page_translations')->insert([
                'cms_page_id' => $page['id'],
                'page_title' => $page['title'],
                'url_key' => $page['url_key'],
                'html_content' => '<div class="static-container"><div class="mb-5">'.$page['title'].' '.$contentLabel.'</div></div>',
                'meta_title' => $page['meta_title'],
                'meta_description' => '',
                'meta_keywords' => $page['meta_keywords'],
                'locale' => 'en',
            ]);
        }
    }
};
