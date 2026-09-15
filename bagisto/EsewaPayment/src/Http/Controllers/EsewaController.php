<?php

namespace Webkul\Esewa\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Webkul\Checkout\Facades\Cart;
use Webkul\Esewa\Payment\EsewaPayment;
use Webkul\Sales\Models\Invoice;
use Webkul\Sales\Models\Order;
use Webkul\Sales\Repositories\InvoiceRepository;
use Webkul\Sales\Repositories\OrderRepository;
use Webkul\Sales\Repositories\OrderTransactionRepository;
use Webkul\Sales\Transformers\OrderResource;

class EsewaController extends Controller
{
    public const PAYMENT_CAPTURED = 'captured';

    public function __construct(
        protected EsewaPayment $esewaPayment,
        protected OrderRepository $orderRepository,
        protected OrderTransactionRepository $orderTransactionRepository,
        protected InvoiceRepository $invoiceRepository,
    ) {}

    /**
     * Builds the signed form and returns a page that auto-submits it to eSewa. The
     * Bagisto order does not exist yet at this point — same as every other redirect
     * gateway here — it is created only once eSewa confirms the money actually moved,
     * in handlePaymentSuccess() below.
     */
    public function redirect(): RedirectResponse|View
    {
        if (! $this->esewaPayment->hasValidCredentials()) {
            session()->flash('error', 'eSewa is not configured.');

            return redirect()->back();
        }

        $cart = Cart::getCart();

        if (! $cart) {
            session()->flash('error', 'Your cart could not be found.');

            return redirect()->back();
        }

        // Prefer the cart's own currency over the raw config default — a cart's
        // base_currency_code can lag behind the channel's actual base currency (it is
        // set once, at cart-creation time), while core()->getChannelBaseCurrencyCode()
        // always reflects the channel's current, correctly-configured value.
        $currency = strtoupper(core()->getChannelBaseCurrencyCode() ?? $cart->base_currency_code);

        if (! $this->esewaPayment->isCurrencySupported($currency)) {
            session()->flash('error', "eSewa only supports NPR. This cart is in {$currency}.");

            return redirect()->back();
        }

        $fields = $this->esewaPayment->buildFormFields(
            $cart,
            route('esewa.payment.success'),
            route('esewa.payment.fail'),
        );

        return view('esewa::redirect-form', [
            'formUrl' => $this->esewaPayment->getFormUrl(),
            'fields' => $fields,
        ]);
    }

    /**
     * eSewa's success_url, hit as a GET redirect carrying a base64-encoded JSON
     * payload in `data`. That payload is checked for a valid signature but is never
     * treated as proof of payment on its own — a redirect can be replayed or forged.
     * The status-check call below is the actual authority.
     */
    public function paymentSuccess(Request $request): RedirectResponse
    {
        if (! $this->esewaPayment->hasValidCredentials()) {
            session()->flash('error', 'eSewa is not configured.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $raw = $request->query('data') ?? $request->input('data');

        if (! $raw) {
            session()->flash('error', 'eSewa did not return a payment result.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $decoded = json_decode(base64_decode($raw), true);

        if (! is_array($decoded) || empty($decoded['transaction_uuid']) || empty($decoded['total_amount'])) {
            session()->flash('error', 'Could not read the payment result from eSewa.');

            return redirect()->route('shop.checkout.cart.index');
        }

        if (! $this->esewaPayment->verifyResponseSignature($decoded)) {
            report(new \RuntimeException('eSewa response signature mismatch: '.json_encode($decoded)));

            session()->flash('error', 'The payment response could not be verified.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $status = $this->esewaPayment->getTransactionStatus(
            (string) $decoded['transaction_uuid'],
            (string) $decoded['total_amount'],
        );

        if (! $status || ($status['status'] ?? null) !== 'COMPLETE') {
            session()->flash('error', 'eSewa has not confirmed this payment yet. If money left your account, contact us with your transaction ID before trying again.');

            return redirect()->route('shop.checkout.cart.index');
        }

        $cart = Cart::getCart();

        if (! $cart) {
            session()->flash('error', 'Your cart could not be found.');

            return redirect()->route('shop.checkout.cart.index');
        }

        // The status check is authoritative on whether money moved; it is not
        // authoritative on what for. Refuse rather than charge a mismatched cart.
        $paid = number_format((float) ($status['total_amount'] ?? 0), 2, '.', '');
        $expected = number_format((float) $cart->base_grand_total, 2, '.', '');

        if ($paid !== $expected) {
            report(new \RuntimeException("eSewa paid amount {$paid} does not match cart total {$expected} (transaction {$decoded['transaction_uuid']})"));

            session()->flash('error', 'The confirmed payment amount does not match this order. Contact us with your transaction ID.');

            return redirect()->route('shop.checkout.cart.index');
        }

        return $this->handlePaymentSuccess($cart, $decoded, $status);
    }

    public function paymentFail(): RedirectResponse
    {
        session()->flash('error', 'The eSewa payment was not completed.');

        return redirect()->route('shop.checkout.cart.index');
    }

    protected function handlePaymentSuccess($cart, array $decoded, array $status): RedirectResponse
    {
        try {
            $orderData = (new OrderResource($cart))->jsonSerialize();

            $order = $this->orderRepository->create($orderData);

            if ($order->payment) {
                $order->payment->update([
                    'additional' => [
                        'status' => Invoice::STATUS_PAID,
                        'esewa_transaction_uuid' => $decoded['transaction_uuid'],
                        'esewa_ref_id' => $status['ref_id'] ?? null,
                    ],
                ]);
            }

            $this->orderRepository->update(['status' => Order::STATUS_PROCESSING], $order->id);

            $invoice = $this->invoiceRepository->create($this->prepareInvoiceData($order->id));

            $this->orderTransactionRepository->create([
                'transaction_id' => $status['ref_id'] ?? $decoded['transaction_uuid'],
                'status' => self::PAYMENT_CAPTURED,
                'type' => $order->payment->method,
                'payment_method' => $order->payment->method,
                'order_id' => $order->id,
                'invoice_id' => $invoice->id,
                'amount' => $orderData['base_grand_total'] ?? 0,
                'data' => json_encode([
                    'esewa_transaction_uuid' => $decoded['transaction_uuid'],
                    'esewa_ref_id' => $status['ref_id'] ?? null,
                    'esewa_status' => $status['status'] ?? null,
                ]),
            ]);

            Cart::deActivateCart();

            session()->flash('order_id', $order->id);

            /*
             * Not Bagisto's own onepage.success — the customer never chose to be
             * here, and Bagisto's own "thank you" page is a shop's, not the firm's.
             * Sending them back to the application's dashboard means the moment
             * they see confirmation is inside Haatma Okil, and it is also where
             * documentCreditsAvailable() sweeps this invoice into an entitlement
             * the instant they land.
             */
            return redirect()->away(rtrim(env('LEGAL_APP_URL', 'http://localhost:3000'), '/').'/dashboard');
        } catch (\Throwable $e) {
            report($e);

            session()->flash('error', 'The payment was confirmed by eSewa, but the order could not be finished. Contact us with your transaction ID: '.($decoded['transaction_uuid'] ?? 'unknown'));

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
