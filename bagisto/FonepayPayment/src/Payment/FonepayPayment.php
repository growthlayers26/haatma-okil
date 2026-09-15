<?php

namespace Webkul\Fonepay\Payment;

use Webkul\Payment\Payment\Payment;

/**
 * Fonepay's "merchantRequest" redirect gateway — a signed GET redirect to Fonepay's
 * own hosted payment page, then a signed return to `RU`. The same shape as eSewa's
 * Epay, and verified the same way: two independent open-source implementations
 * (github.com/prabinpant/fonepay-node, github.com/soorajydv/fonepay-integration-Nodejs)
 * agree exactly on the field order and HMAC-SHA512 algorithm below, and both the
 * sandbox (dev-clientapi.fonepay.com) and production (clientapi.fonepay.com) hosts
 * were confirmed live from the server before this was written.
 *
 * A separate Fonepay product exists — "Dynamic QR" — that would let the customer
 * scan a QR without leaving this site at all, matching the checkout page's existing
 * "any connected bank app" copy more literally. Its sandbox host was already dead
 * when checked, with no second source to verify the request format against, so it
 * was not used here.
 */
class FonepayPayment extends Payment
{
    protected $code = 'fonepay';

    protected $supportedCurrencies = ['NPR'];

    public const LIVE_URL = 'https://clientapi.fonepay.com/api/merchantRequest';

    public const TEST_URL = 'https://dev-clientapi.fonepay.com/api/merchantRequest';

    public const PAYMENT_MODE = 'P';

    /** Field order for the outbound request signature — order is part of the signature. */
    public const REQUEST_FIELDS = ['PID', 'MD', 'PRN', 'AMT', 'CRN', 'DT', 'R1', 'R2', 'RU'];

    /** Field order Fonepay signs the return response with. */
    public const RESPONSE_FIELDS = ['PRN', 'PID', 'PS', 'RC', 'UID', 'BC', 'INI', 'P_AMT', 'R_AMT'];

    public function getRedirectUrl()
    {
        return route('fonepay.payment.redirect');
    }

    public function isAvailable()
    {
        return parent::isAvailable() && $this->hasValidCredentials();
    }

    public function getTitle()
    {
        return $this->getConfigData('title') ?? 'Fonepay';
    }

    public function getDescription()
    {
        return $this->getConfigData('description') ?? 'Pay with Fonepay.';
    }

    public function isSandbox()
    {
        return (bool) $this->getConfigData('sandbox');
    }

    public function getMerchantCode()
    {
        return $this->isSandbox()
            ? $this->getConfigData('test_merchant_code')
            : $this->getConfigData('merchant_code');
    }

    public function getSecretKey()
    {
        return $this->isSandbox()
            ? $this->getConfigData('test_secret_key')
            : $this->getConfigData('secret_key');
    }

    public function hasValidCredentials()
    {
        return $this->getMerchantCode() && $this->getSecretKey();
    }

    public function getPaymentUrl()
    {
        return $this->isSandbox() ? self::TEST_URL : self::LIVE_URL;
    }

    public function getSupportedCurrencies()
    {
        return $this->supportedCurrencies;
    }

    public function isCurrencySupported($currency)
    {
        return in_array(strtoupper($currency), $this->supportedCurrencies);
    }

    public function sign(array $fields, array $order): string
    {
        $message = implode(',', array_map(fn ($k) => (string) $fields[$k], $order));

        return hash_hmac('sha512', $message, $this->getSecretKey());
    }

    /**
     * Builds the full signed redirect URL for one cart. `PRN` must be unique per
     * request — built from the cart id and a timestamp, the same shape used for
     * eSewa's transaction_uuid.
     */
    public function buildRedirectUrl($cart, string $returnUrl): array
    {
        $amount = number_format((float) $cart->base_grand_total, 2, '.', '');
        $prn = $cart->id.'-'.now()->format('YmdHis');

        $fields = [
            'PID' => $this->getMerchantCode(),
            'MD' => self::PAYMENT_MODE,
            'PRN' => $prn,
            'AMT' => $amount,
            'CRN' => 'NPR',
            'DT' => now()->format('m/d/Y'),
            'R1' => 'Order for cart '.$cart->id,
            'R2' => 'Haatma Okil',
            'RU' => $returnUrl,
        ];

        $dv = $this->sign($fields, self::REQUEST_FIELDS);

        $query = http_build_query($fields + ['DV' => $dv]);

        return ['url' => $this->getPaymentUrl().'?'.$query, 'prn' => $prn, 'amount' => $amount];
    }

    /**
     * Verifies the signature Fonepay attaches to the return-redirect. Not treated as
     * proof of payment on its own — PS and RC are checked by the caller too — the
     * same principle applied to eSewa's response.
     */
    public function verifyResponseSignature(array $response): bool
    {
        foreach (self::RESPONSE_FIELDS as $field) {
            if (! array_key_exists($field, $response)) {
                return false;
            }
        }

        if (empty($response['DV'])) {
            return false;
        }

        $expected = $this->sign($response, self::RESPONSE_FIELDS);

        return hash_equals(strtolower($expected), strtolower($response['DV']));
    }
}
