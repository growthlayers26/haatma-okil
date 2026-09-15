<?php

namespace Webkul\Esewa\Payment;

use Illuminate\Support\Facades\Http;
use Webkul\Checkout\Facades\Cart;
use Webkul\Payment\Payment\Payment;

/**
 * eSewa ePay v2.
 *
 * A redirect gateway, not a client-side widget: the browser is sent to eSewa with a
 * signed form, and comes back to a success/failure URL on this domain. Signing and
 * status-check logic mirror lib/payments/esewa.ts in the Next.js app — that file talks
 * to the same eSewa endpoints for the same reason, but nothing in it runs at checkout,
 * because checkout is Bagisto's, not the Next.js app's. This is the piece that
 * actually executes at checkout.
 */
class EsewaPayment extends Payment
{
    /**
     * Payment method code.
     *
     * @var string
     */
    protected $code = 'esewa';

    /**
     * eSewa quotes amounts in rupees, and only supports NPR.
     *
     * @var array
     */
    protected $supportedCurrencies = ['NPR'];

    public const LIVE_FORM_URL = 'https://epay.esewa.com.np/api/epay/main/v2/form';

    public const TEST_FORM_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    /**
     * Confirmed against eSewa's own documentation at developer.esewa.com.np/pages/Epay
     * — the production status-check host has no "epay." prefix, unlike the form URL.
     */
    public const LIVE_STATUS_URL = 'https://esewa.com.np/api/epay/transaction/status/';

    public const TEST_STATUS_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/';

    /**
     * Fields signed on the outbound (redirect) request, in this exact order — field
     * order is part of the signature, not just its content.
     */
    public const REQUEST_SIGNED_FIELDS = ['total_amount', 'transaction_uuid', 'product_code'];

    public function getRedirectUrl()
    {
        return route('esewa.payment.redirect');
    }

    public function isAvailable()
    {
        return parent::isAvailable() && $this->hasValidCredentials();
    }

    public function getTitle()
    {
        return $this->getConfigData('title') ?? 'eSewa';
    }

    public function getDescription()
    {
        return $this->getConfigData('description') ?? 'Pay with your eSewa wallet.';
    }

    public function isSandbox()
    {
        return (bool) $this->getConfigData('sandbox');
    }

    public function getProductCode()
    {
        return $this->isSandbox()
            ? $this->getConfigData('test_product_code')
            : $this->getConfigData('product_code');
    }

    public function getSecretKey()
    {
        return $this->isSandbox()
            ? $this->getConfigData('test_secret_key')
            : $this->getConfigData('secret_key');
    }

    public function hasValidCredentials()
    {
        return $this->getProductCode() && $this->getSecretKey();
    }

    public function getFormUrl()
    {
        return $this->isSandbox() ? self::TEST_FORM_URL : self::LIVE_FORM_URL;
    }

    public function getStatusUrl()
    {
        return $this->isSandbox() ? self::TEST_STATUS_URL : self::LIVE_STATUS_URL;
    }

    public function getSupportedCurrencies()
    {
        return $this->supportedCurrencies;
    }

    public function isCurrencySupported($currency)
    {
        return in_array(strtoupper($currency), $this->supportedCurrencies);
    }

    /**
     * Builds the signed field set eSewa's form expects for one cart.
     *
     * amount/tax/service/delivery are collapsed into a single total rather than broken
     * out, because Bagisto's own grand_total already reflects whatever tax it
     * calculated — asking eSewa to re-derive a breakdown from it would risk the two
     * disagreeing on what the customer owes.
     */
    public function buildFormFields($cart, string $successUrl, string $failureUrl): array
    {
        $total = number_format((float) $cart->base_grand_total, 2, '.', '');

        // eSewa requires this unique per request; alphanumeric and hyphen only.
        $transactionUuid = $cart->id.'-'.now()->format('YmdHis');

        $fields = [
            'amount' => $total,
            'tax_amount' => '0',
            'total_amount' => $total,
            'transaction_uuid' => $transactionUuid,
            'product_code' => $this->getProductCode(),
            'product_service_charge' => '0',
            'product_delivery_charge' => '0',
            'success_url' => $successUrl,
            'failure_url' => $failureUrl,
            'signed_field_names' => implode(',', self::REQUEST_SIGNED_FIELDS),
        ];

        $fields['signature'] = $this->sign($fields, self::REQUEST_SIGNED_FIELDS);

        return $fields;
    }

    /**
     * eSewa signs a comma-joined key=value string over exactly the fields named in
     * signed_field_names, in that order — both on the way out and on the way back.
     */
    public function sign(array $fields, array $signedFieldNames): string
    {
        $message = implode(',', array_map(
            fn ($name) => "{$name}={$fields[$name]}",
            $signedFieldNames
        ));

        return base64_encode(hash_hmac('sha256', $message, $this->getSecretKey(), true));
    }

    /**
     * Verifies the signature eSewa attaches to the success-redirect payload. This is a
     * cheap first check, not the authority — a redirect can be replayed or forged, so
     * getTransactionStatus() below is what actually decides whether the order is paid.
     */
    public function verifyResponseSignature(array $data): bool
    {
        if (empty($data['signed_field_names']) || empty($data['signature'])) {
            return false;
        }

        $signedFieldNames = explode(',', $data['signed_field_names']);

        foreach ($signedFieldNames as $field) {
            if (! array_key_exists($field, $data)) {
                return false;
            }
        }

        $expected = $this->sign($data, $signedFieldNames);

        return hash_equals($expected, $data['signature']);
    }

    /**
     * Server-to-server status check — the actual source of truth for whether money
     * moved, per eSewa's own guidance.
     */
    public function getTransactionStatus(string $transactionUuid, string $totalAmount): ?array
    {
        try {
            $response = Http::timeout(15)->get($this->getStatusUrl(), [
                'product_code' => $this->getProductCode(),
                'total_amount' => $totalAmount,
                'transaction_uuid' => $transactionUuid,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }

        return $response->successful() ? $response->json() : null;
    }

    public function setCartFromSession()
    {
        $this->cart = Cart::getCart();

        return $this->cart;
    }
}
