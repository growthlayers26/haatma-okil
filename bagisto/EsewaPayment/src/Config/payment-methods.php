<?php

use Webkul\Esewa\Payment\EsewaPayment;

/**
 * Sandbox by default, using eSewa's own published UAT merchant code and secret —
 * documented publicly at developer.esewa.com.np/pages/Test-credentials, not specific
 * to this store. Switch `sandbox` to false and fill in `product_code`/`secret_key`
 * once a real eSewa merchant account exists; nothing else about this file changes.
 */
return [
    'esewa' => [
        'class' => EsewaPayment::class,
        'code' => 'esewa',
        'title' => 'eSewa',
        'description' => 'Pay with your eSewa wallet.',
        'active' => true,
        'sandbox' => true,
        'test_product_code' => 'EPAYTEST',
        'test_secret_key' => '8gBm/:&EnhH.1/q',
        'product_code' => '',
        'secret_key' => '',
        'sort' => 3,
    ],
];
