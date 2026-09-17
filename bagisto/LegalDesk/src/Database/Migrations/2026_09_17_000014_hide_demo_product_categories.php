<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The storefront's top nav was still showing Bagisto's seed catalog — Mens, Womens,
 * Kids, Wellness, Bookings, Electronics, Household, Books & Stationery, and their
 * forty-odd subcategories — none of which this firm sells. The 41 real products
 * (Employment Contract, NDA, Will, Power of Attorney, ...) were never assigned to
 * any category at all: `product_categories` has zero rows. So this tree was not
 * lightly out of date, it was never connected to anything real.
 *
 * It's also not load-bearing. The Next.js app never links to a Bagisto category
 * page — checkout only ever reaches Bagisto through `/legal/buy/{sku}`, a direct
 * SKU lookup (see app/api/payment/initiate/route.ts). Disabling this tree cannot
 * break a purchase.
 *
 * CategoryRepository::getCategoryTree() filters `where('status', 1)`, which is what
 * builds the storefront's mega menu — so disabling every non-root category here is
 * enough to empty that nav, the same lookup the menu itself uses. Root (id 1) stays
 * active; a category tree needs a root to walk from.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('categories')
            ->where('id', '!=', 1)
            ->update(['status' => 0]);
    }

    public function down(): void
    {
        DB::table('categories')
            ->where('id', '!=', 1)
            ->update(['status' => 1]);
    }
};
