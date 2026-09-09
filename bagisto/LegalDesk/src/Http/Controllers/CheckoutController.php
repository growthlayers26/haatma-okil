<?php

namespace HaatmaOkil\LegalDesk\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
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
 * The cost is that a customer signs in twice — once to the application, once to the
 * shop — because these are two applications sharing one account rather than one
 * application. Worth naming rather than hiding: it is the visible seam of this
 * integration, and closing it means sharing a session between the two, which is a
 * decision about cookie scope that the firm should make deliberately.
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
    public function buy(string $sku): RedirectResponse
    {
        $product = $this->productRepository->findOneByField('sku', $sku);

        if (! $product || ! $product->status) {
            return redirect()
                ->route('shop.home.index')
                ->with('error', 'That item is not available.');
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
}
