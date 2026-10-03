<?php

namespace HaatmaOkil\LegalDesk\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Webkul\Checkout\Facades\Cart;
use Webkul\Product\Repositories\ProductRepository;

/**
 * The hand-off from the application to Bagisto's checkout.
 *
 * Deliberately a browser redirect rather than a server-to-server call. Bagisto's cart
 * lives in the session, so a cart built from the application's backend would belong to
 * the application's HTTP client and not to the person buying. Sending the browser here
 * means the session, the sign-in state and the cart are all the customer's own, and
 * Bagisto's existing checkout works without being reimplemented.
 *
 * That leaves one thing unresolved by the redirect alone: which customer's session
 * this browser happens to be carrying. It could be stale, or it could belong to
 * someone who used this browser before — either way, buy() must not just trust it.
 * The `handoff` query parameter is how the application vouches for who is actually
 * buying, and for what; see findHandoff() and mintCheckoutHandoff() in
 * lib/payments/checkoutHandoff.ts.
 */
class CheckoutController extends Controller
{
    public function __construct(protected ProductRepository $productRepository) {}

    /**
     * Put the purchase in the cart and go straight to checkout.
     *
     * The SKUs are the join between the two halves of the system — see skusOf() in
     * lib/payments/catalogue.ts. They come from the hand-off row the application wrote,
     * not from the URL: a purchase can be more than one line (a document plus an
     * advocate review), and the URL can only name one. The URL's SKU must still be the
     * row's first, so a hand-off minted for one purchase cannot be spent on another.
     *
     * Anything that cannot be bought — a token that is missing or spent, an item that
     * is not in the catalogue — sends the customer back to the application, which
     * explains and offers another go. It used to land them on Bagisto's own home page,
     * which has nothing on it now and nothing to say what had just gone wrong.
     */
    public function buy(Request $request, string $sku): RedirectResponse
    {
        $handoff = $this->findHandoff($request);

        if (! $handoff) {
            return $this->backToApp();
        }

        $skus = array_values(array_filter(array_map('trim', explode(',', (string) $handoff->sku))));

        if ($skus === [] || $skus[0] !== $sku) {
            return $this->backToApp();
        }

        // Every product is checked before the hand-off is spent, so an item that is
        // not available does not also burn the customer's token.
        $products = [];

        foreach ($skus as $itemSku) {
            $product = $this->productRepository->findOneByField('sku', $itemSku);

            if (! $product || ! $product->status) {
                return $this->backToApp();
            }

            $products[] = $product;
        }

        if (! $this->spendHandoff($handoff)) {
            return $this->backToApp();
        }

        $customerId = (int) $handoff->customer_id;

        if ((int) Auth::guard('customer')->id() !== $customerId) {
            // Whatever was active belonged to nobody, or to somebody else. The
            // handoff token just proved who actually asked to buy this, so that
            // customer replaces whoever (if anyone) this browser's session named —
            // logout first so a stale "remember me" cookie for the wrong customer
            // does not outlive this request, and regenerate the session id so the
            // new identity is not layered onto whatever the old session was doing.
            Auth::guard('customer')->logout();
            $request->session()->regenerate();
            Auth::guard('customer')->loginUsingId($customerId);
        }

        try {
            // Start clean. Otherwise a half-finished purchase from an earlier visit
            // rides along and the customer is billed for something they did not
            // choose this time.
            Cart::deActivateCart();

            foreach ($products as $product) {
                Cart::addProduct($product, [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                ]);
            }
        } catch (\Throwable $e) {
            report($e);

            return $this->backToApp();
        }

        return redirect()->route('shop.checkout.onepage.index');
    }

    /**
     * Where a purchase that could not start is sent: a page in the application that
     * says nothing was charged and offers another attempt.
     */
    protected function backToApp(): RedirectResponse
    {
        return redirect()->away(rtrim(env('LEGAL_APP_URL', 'http://localhost:3000'), '/').'/payment/problem');
    }

    /**
     * The hand-off row this request's token names, if it is still good — not yet
     * spent and not yet expired. Reading it does not spend it; see spendHandoff().
     *
     * Compared using the database's own clock, not PHP's now(). This row is written
     * by a Node process and read by this PHP one — app.timezone (Asia/Kolkata) has
     * nothing to do with either of them, and the one clock both already agree on is
     * the connection they share. Comparing expires_at (set with MySQL's NOW()) against
     * PHP's now() compares a UTC timestamp against a UTC+5:30 one, which made every
     * token look expired the instant it was minted.
     */
    protected function findHandoff(Request $request): ?object
    {
        $token = $request->query('handoff');

        if (! is_string($token) || $token === '') {
            return null;
        }

        return DB::table('legal_checkout_handoffs')
            ->where('token_hash', hash('sha256', $token))
            ->whereRaw('expires_at > NOW()')
            ->whereNull('used_at')
            ->first();
    }

    /**
     * Marks the hand-off spent, returning whether this request is the one that did.
     *
     * The UPDATE against `used_at IS NULL` is what makes spending atomic: two
     * requests racing on the same token (a double-tapped link, a retried redirect)
     * can both read the row, but only one of them flips it to spent, so only one
     * gets to build a cart.
     */
    protected function spendHandoff(object $handoff): bool
    {
        return (bool) DB::table('legal_checkout_handoffs')
            ->where('id', $handoff->id)
            ->whereNull('used_at')
            ->update(['used_at' => DB::raw('NOW()')]);
    }
}
