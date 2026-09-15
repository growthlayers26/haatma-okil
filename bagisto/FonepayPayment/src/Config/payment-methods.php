<?php

use Webkul\Fonepay\Payment\FonepayPayment;

/**
 * Sandbox by default. Merchant code and secret below are Fonepay's own published test
 * credentials for their Dynamic QR product (developer.esewa.com.np has no equivalent
 * for Fonepay, so this came from a community-mirrored copy of Fonepay's technical
 * spec) — NOT confirmed to work against this specific redirect endpoint, since no
 * source gave test credentials for merchantRequest specifically. If they do not work
 * live, Fonepay will need to be asked directly for sandbox credentials for this
 * endpoint. Switch `sandbox` to false and fill in real credentials once a merchant
 * account exists; nothing else about this file changes.
 */
return [
    'fonepay' => [
        'class' => FonepayPayment::class,
        'code' => 'fonepay',
        'title' => 'Fonepay',
        'description' => 'Pay with Fonepay.',
        'active' => true,
        'sandbox' => true,
        'test_merchant_code' => 'fonepay123',
        'test_secret_key' => 'fonepay',
        'merchant_code' => '',
        'secret_key' => '',
        'sort' => 4,
    ],
];
