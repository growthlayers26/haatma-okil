<?php

namespace HaatmaOkil\LegalDesk\Cache;

use Illuminate\Http\Request;
use Spatie\ResponseCache\CacheProfiles\CacheAllSuccessfulGetRequests;

/**
 * Bagisto shipped `RESPONSE_CACHE_ENABLED=true` with Spatie's stock
 * CacheAllSuccessfulGetRequests profile, which caches every successful GET by path
 * alone. Webkul's own hasher (packages/Webkul/FPC/src/Hasher/DefaultHasher.php)
 * normalizes that key to path only — it drops the query string entirely (bar one
 * carve-out for search) — and neither piece knows about sessions or customers.
 *
 * That is fine for a product page, and it is a real bug for anything the response
 * actually differs on per visitor: /legal/buy/{sku}?handoff=<token> signs the
 * browser's Bagisto session in as whoever the token names — the handoff query string
 * is exactly what the hasher throws away, so the first customer to buy a given
 * document has their signed-in page cached, and the next customer to buy that same
 * document, with their own different token, would be served the first customer's
 * page instead of their own. Every guest cart page under /checkout has the same
 * problem one level down: two anonymous visitors share no token at all, only a
 * session cookie the cache key never sees.
 *
 * Bagisto's own customer-routes.php already wraps the authenticated account area in
 * NoCacheMiddleware, which looks like it addresses this — it does not. It only sets
 * Cache-Control/Pragma/Expires on the outgoing response, telling the *browser* not to
 * keep a copy. Spatie's response-cache middleware caches the response server-side
 * before those headers matter, keyed on path, so it caches account pages too.
 *
 * This profile keeps Spatie's default behaviour (still worth having for the public
 * catalogue and static pages) and refuses to cache anything that is either
 * structurally session/customer-scoped or, as a backstop for routes this list
 * doesn't name, being served to a signed-in customer right now.
 *
 * Verified live: Bagisto-FPC (the cache debug header) appears on a second request to
 * "/" but never on a second request to /checkout/cart, /legal/buy/{sku}, or /compare.
 */
class SafeResponseCacheProfile extends CacheAllSuccessfulGetRequests
{
    /**
     * Path prefixes where the response is scoped to a session, a customer, or a
     * one-time handoff token rather than being the same page for everyone.
     */
    private const UNCACHEABLE_PATH_PREFIXES = [
        'legal/buy',
        'checkout',
        'customer',
        'compare',
        'cart',
    ];

    public function shouldCacheRequest(Request $request): bool
    {
        if (! parent::shouldCacheRequest($request)) {
            return false;
        }

        if (auth()->guard('customer')->check()) {
            return false;
        }

        $path = ltrim($request->path(), '/');

        foreach (self::UNCACHEABLE_PATH_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return false;
            }
        }

        return true;
    }
}
