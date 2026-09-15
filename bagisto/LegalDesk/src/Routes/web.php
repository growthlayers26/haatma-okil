<?php

use Illuminate\Support\Facades\Route;
use HaatmaOkil\LegalDesk\Http\Controllers\CheckoutController;

/*
 * Browser-facing, so it runs under the `web` middleware group and therefore inside
 * a Bagisto session — that is the whole reason this is not an API route: the cart
 * has to be built by the customer's own browser. Which customer is not taken from
 * that session, though; see the `handoff` check in CheckoutController::buy().
 */
Route::get('legal/buy/{sku}', [CheckoutController::class, 'buy'])
    ->name('legal.buy')
    ->where('sku', '[A-Za-z0-9\-_]+');
