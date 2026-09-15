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
 * buying; see resolveHandoffCustomer() and mintCheckoutHandoff() in
 * lib/payments/checkoutHandoff.ts.
 */
class CheckoutController extends Controller
{
    public function __construct(protected ProductRepository $productRepository) {}

    /**
     * Put one purchasable item in the cart and go straight to checkout.
     *
     * The SKU is the join between the two halves of the system — see skuOf() in
     * lib/payments/orders.ts. Anything not in the catalogue is refused rather than
     * silently dropping the customer into an empty cart with no explanation.
     */
    public function buy(Request $request, string $sku): RedirectResponse
    {
        $product = $this->productRepository->findOneByField('sku', $sku);

        if (! $product || ! $product->status) {
            return redirect()
                ->route('shop.home.index')
                ->with('error', 'That item is not available.');
        }

        $customerId = $this->resolveHandoffCustomer($request);

        if (! $customerId) {
            return redirect()
                ->route('shop.home.index')
                ->with('error', 'Start checkout again from your Haatma Okil account.');
        }

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

            Cart::addProduct($product, [
                'product_id' => $product->id,
                'quantity'   => 1,
            ]);
        } catch (\Throwable $e) {
            return redirect()
                ->route('shop.home.index')
                ->with('error', $e->getMessage());
        }

        return redirect()->route('shop.checkout.onepage.index');
    }

    /**
     * Spends the one-time handoff token minted by the application, returning the
     * customer id it vouches for — or null if the token is missing, unknown,
     * expired, or already spent.
     *
     * The UPDATE against `used_at IS NULL` is what makes spending atomic: two
     * requests racing on the same token (a double-tapped link, a retried redirect)
     * can both read the row, but only one of them flips it to spent, so only one
     * gets a customer id back.
     */
    protected function resolveHandoffCustomer(Request $request): ?int
    {
        $token = $request->query('handoff');

        if (! is_string($token) || $token === '') {
            return null;
        }

        $hash = hash('sha256', $token);

        /*
         * Compared and stamped using the database's own clock throughout, not
         * PHP's now(). This row is written by a Node process and read by this
         * PHP one — app.timezone (Asia/Kolkata) has nothing to do with either of
         * them, and the one clock both already agree on is the connection they
         * share. Comparing expires_at (set with MySQL's NOW()) against PHP's
         * now() compares a UTC timestamp against a UTC+5:30 one, which made
         * every token look expired the instant it was minted.
         */
        $handoff = DB::table('legal_checkout_handoffs')
            ->where('token_hash', $hash)
            ->whereRaw('expires_at > NOW()')
            ->whereNull('used_at')
            ->first();

        if (! $handoff) {
            return null;
        }

        $spent = DB::table('legal_checkout_handoffs')
            ->where('id', $handoff->id)
            ->whereNull('used_at')
            ->update(['used_at' => DB::raw('NOW()')]);

        return $spent ? (int) $handoff->customer_id : null;
    }
}
