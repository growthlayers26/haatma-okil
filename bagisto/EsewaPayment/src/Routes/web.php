<?php

use Illuminate\Support\Facades\Route;
use Webkul\Esewa\Http\Controllers\EsewaController;

Route::controller(EsewaController::class)
    ->middleware('web')
    ->prefix('esewa/payment')
    ->group(function () {
        Route::get('redirect', 'redirect')->name('esewa.payment.redirect');

        Route::match(['get', 'post'], 'success', 'paymentSuccess')->name('esewa.payment.success');

        Route::match(['get', 'post'], 'fail', 'paymentFail')->name('esewa.payment.fail');
    });
