<?php

use Illuminate\Support\Facades\Route;
use HaatmaOkil\LegalDesk\Http\Controllers\CheckoutController;

/*
 * Browser-facing, so it runs under the `web` middleware group and therefore inside
 * the customer's own Bagisto session. That is the whole reason this is not an API
 * route: the cart must belong to the person buying.
 */
Route::get('legal/buy/{sku}', [CheckoutController::class, 'buy'])
    ->name('legal.buy')
    ->where('sku', '[A-Za-z0-9\-_]+');
