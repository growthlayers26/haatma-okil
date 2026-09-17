<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The channel's logo (channels.logo, storage/app/public/channel/1/logo.svg) was
 * never a designed mark — it was a 180x32 SVG with nothing in it but the firm's
 * name set in Georgia, added by 2026_09_03_000010_brand_the_shop.php as a
 * placeholder. `Channel::logo_url()` returns it whenever it's set, ahead of any
 * `?? asset(...)` fallback a view supplies, so replacing it here is what actually
 * changes what the checkout header shows — the header templates' own fallback path
 * never gets reached while this column has a value.
 *
 * storage/app/public/channel/1/logo.png already holds the real mark (the same "ह"
 * design used for app/icon.png and the site favicon); this only repoints the column
 * at it.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('channels')
            ->where('id', 1)
            ->update(['logo' => 'channel/1/logo.png']);
    }

    public function down(): void
    {
        DB::table('channels')
            ->where('id', 1)
            ->update(['logo' => 'channel/1/logo.svg']);
    }
};
