<?php

namespace Webkul\Fonepay\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Webkul\Checkout\Facades\Cart;
use Webkul\Fonepay\Payment\FonepayPayment;
use Webkul\Sales\Models\Invoice;
use Webkul\Sales\Models\Order;
use Webkul\Sales\Repositories\InvoiceRepository;
use Webkul\Sales\Repositories\OrderRepository;
use Webkul\Sales\Repositories\OrderTransactionRepository;
use Webkul\Sales\Transformers\OrderResource;

class FonepayController extends Controller
{
    public const PAYMENT_CAPTURED = 'captured';

    public function __construct(
        protected FonepayPayment $fonepayPayment,
        protected OrderRepository $orderRepository,
        protected OrderTransactionRepository $orderTransactionRepository,
        protected InvoiceRepository $invoiceRepository,
    ) {}

    /**
     * Builds the signed URL and sends the browser to Fonepay's own hosted page. The
     * Bagisto order does not exist yet — same as every other redirect gateway here —
     * it is created only once Fonepay confirms the money actually moved, in
     * handlePaymentSuccess() below.
     */
    public function redirect(): RedirectResponse
    {
        if (! $this->fonepayPayment->hasValidCredentials()) {
            session()->flash('error', 'Fonepay is not configured.');

            return redirect()->back();
        }

        $cart = Cart::getCart();

        if (! $cart) {
            session()->flash('error', 'Your cart could not be found.');

            return redirect()->back();
        }

        $currency = strtoupper(core()->getChannelBaseCurrencyCode() ?? $cart->base_currency_code);

        if (! $this->fonepayPayment->isCurrencySupported($currency)) {
            session()->flash('error', "Fonepay only supports NPR. This cart is in {$currency}.");

            return redirect()->back();
        }

        $built = $this->fonepayPayment->buildRedirectUrl($cart, route('fonepay.payment.return'));

        return redirect()->away($built['url']);
    }

    /**
     * Fonepay's RU — hit as a GET redirect carrying PRN/PID/PS/RC/UID/BC/INI/P_AMT/
     * R_AMT/DV as query parameters.
     */
    public function paymentReturn(Request $request): RedirectResponse
    {
        if (! $this->fonepayPayment->hasValidCredentials()) {
            session()->flash('error', 'Fonepay is not configured.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $response = $request->query();

        if (! $this->fonepayPayment->verifyResponseSignature($response)) {
            report(new \RuntimeException('Fonepay response signature mismatch: '.json_encode($response)));

            session()->flash('error', 'The payment response could not be verified.');

            return redirect()->route('shop.checkout.cart.index');
        }

        if (($response['RC'] ?? null) !== 'successful' || strtolower((string) ($response['PS'] ?? '')) !== 'true') {
            session()->flash('error', 'The Fonepay payment was not completed.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $cart = Cart::getCart();

        if (! $cart) {
            session()->flash('error', 'Your cart could not be found.');

            return redirect()->route('shop.checkout.cart.index');
        }

        // The response confirms money moved; it is not on its own proof of what for.
        // Refuse rather than complete an order at a mismatched amount.
        $paid = number_format((float) ($response['P_AMT'] ?? 0), 2, '.', '');
        $expected = number_format((float) $cart->base_grand_total, 2, '.', '');

        if ($paid !== $expected) {
            report(new \RuntimeException("Fonepay paid amount {$paid} does not match cart total {$expected} (PRN {$response['PRN']})"));

            session()->flash('error', 'The confirmed payment amount does not match this order. Contact us with your transaction ID.');

            return redirect()->route('shop.checkout.cart.index');
        }

        return $this->handlePaymentSuccess($cart, $response);
    }

    protected function handlePaymentSuccess($cart, array $response): RedirectResponse
    {
        try {
            $orderData = (new OrderResource($cart))->jsonSerialize();

            $order = $this->orderRepository->create($orderData);

            if ($order->payment) {
                $order->payment->update([
                    'additional' => [
                        'status' => Invoice::STATUS_PAID,
                        'fonepay_prn' => $response['PRN'],
                        'fonepay_uid' => $response['UID'] ?? null,
                    ],
                ]);
            }

            $this->orderRepository->update(['status' => Order::STATUS_PROCESSING], $order->id);

            $invoice = $this->invoiceRepository->create($this->prepareInvoiceData($order->id));

            $this->orderTransactionRepository->create([
                'transaction_id' => $response['UID'] ?? $response['PRN'],
                'status' => self::PAYMENT_CAPTURED,
                'type' => $order->payment->method,
                'payment_method' => $order->payment->method,
                'order_id' => $order->id,
                'invoice_id' => $invoice->id,
                'amount' => $orderData['base_grand_total'] ?? 0,
                'data' => json_encode([
                    'fonepay_prn' => $response['PRN'],
                    'fonepay_uid' => $response['UID'] ?? null,
                    'fonepay_bank_code' => $response['BC'] ?? null,
                ]),
            ]);

            Cart::deActivateCart();

            session()->flash('order_id', $order->id);

            return redirect()->route('shop.checkout.onepage.success');
        } catch (\Throwable $e) {
            report($e);

            session()->flash('error', 'The payment was confirmed by Fonepay, but the order could not be finished. Contact us with your transaction ID: '.($response['PRN'] ?? 'unknown'));

            return redirect()->route('shop.checkout.cart.index');
        }
    }

    protected function prepareInvoiceData(int $orderId): array
    {
        $order = $this->orderRepository->findOrFail($orderId);

        $invoiceItems = [];

        foreach ($order->items as $item) {
            if ($item->qty_to_invoice > 0) {
                $invoiceItems[$item->id] = $item->qty_to_invoice;
            }
        }

        return [
            'order_id' => $order->id,
            'invoice' => [
                'items' => $invoiceItems,
            ],
        ];
    }
}
