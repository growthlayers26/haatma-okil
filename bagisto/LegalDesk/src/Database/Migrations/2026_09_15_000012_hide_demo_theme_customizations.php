<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Take the demo shop off the homepage.
 *
 * A fresh Bagisto seeds its storefront home page with e-commerce theme blocks —
 * a fashion hero carousel, "Free Shipping" / "EMI Available" trust badges, Mens
 * / Womens / Kids product carousels, footer links to placeholder CMS pages at
 * http://localhost/page/about-us. None of it fits a firm whose customers arrive
 * for one reason: to pay for legal work. RemoveDemoCatalogue already took the
 * sample products out of the catalogue (2026_09_03); this is the same idea
 * applied to the blocks that render the home page around them.
 *
 * Disabled rather than deleted — same reasoning as brand_the_shop: the firm may
 * want to build a real home page here later, in the admin panel's Theme
 * Customization screen, and disabling now (status = 0) leaves that content in
 * place to repurpose rather than gone. Anything the firm re-enables or edits
 * there afterward survives; this only runs once.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('theme_customizations')->update(['status' => 0]);
    }

    public function down(): void
    {
        // Not reversed. Re-enabling demo storefront content on a live law firm's
        // shop is not a rollback anyone wants.
    }
};
