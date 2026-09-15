<?php

use Illuminate\Support\Facades\Route;
use Webkul\Fonepay\Http\Controllers\FonepayController;

Route::controller(FonepayController::class)
    ->middleware('web')
    ->prefix('fonepay/payment')
    ->group(function () {
        Route::get('redirect', 'redirect')->name('fonepay.payment.redirect');

        Route::get('return', 'paymentReturn')->name('fonepay.payment.return');
    });
