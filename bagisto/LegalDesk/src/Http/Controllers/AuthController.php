<?php

namespace HaatmaOkil\LegalDesk\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Webkul\Customer\Models\Customer;
use Webkul\Customer\Models\CustomerGroup;
use Webkul\User\Models\Admin;

/**
 * Sign-in, and nothing else.
 *
 * Identity is the one thing Bagisto owns outright, so this is the single PHP endpoint
 * the Next.js application calls. Everything a password touches happens here: the hash
 * comparison, and the three states a Bagisto account can be in that should stop
 * someone getting in — suspended, deactivated, and unverified where the firm requires
 * verification.
 *
 * Registration deliberately mirrors Bagisto's own rather than reimplementing it. An
 * account this endpoint creates has to be one the shop will also accept, because the
 * shop is where payment happens.
 *
 * The application could hash-compare against the customers table itself, since it
 * already holds a MySQL connection. It deliberately does not. Those three checks are
 * easy to forget and expensive to get wrong, and duplicating them is how the copy
 * drifts from the original.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $customer = Customer::where('email', $data['email'])->first();

        /*
         * One message for "no such account" and for "wrong password". Distinguishing
         * them tells an attacker which addresses are registered, and for a law firm
         * the client list is itself confidential.
         */
        if (! $customer || ! Hash::check($data['password'], $customer->password)) {
            return response()->json(['error' => 'invalid_credentials'], 401);
        }

        if ($customer->is_suspended) {
            return response()->json(['error' => 'suspended'], 403);
        }

        if (! $customer->status) {
            return response()->json(['error' => 'inactive'], 403);
        }

        /*
         * The check this docblock used to claim and not perform.
         *
         * The shop refuses an unverified customer, so letting one into the application
         * produced an account that could draft and could not buy — and the failure
         * surfaced later, at the checkout, with nothing to explain it. Refusing here
         * makes the two halves agree, and names the reason so the sign-in screen can
         * offer to resend the link.
         */
        if (core()->getConfigData('customer.settings.email.verification') && ! $customer->is_verified) {
            return response()->json(['error' => 'not_verified'], 403);
        }

        // Replace any previous token, so signing in again ends the older session.
        $customer->tokens()->delete();

        return response()->json([
            'token'    => $customer->createToken('haatma-okil')->plainTextToken,
            'customer' => $this->present($customer),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['nullable', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:customers,email'],
            'password'   => ['required', 'string', 'min:8'],
            'phone'      => ['nullable', 'string', 'max:255'],
        ]);

        /*
         * Mirrors Bagisto's own registration rather than inventing a second one.
         *
         * The previous version hard-coded `is_verified => 0` and dispatched nothing,
         * which produced an account that worked in the application and was refused by
         * the shop — with no verification email ever sent to resolve it. Since the shop
         * is where payment happens, that meant a customer could register and then find
         * they could not buy anything, and nothing on either side explained why.
         *
         * So the verification decision comes from the same config Bagisto's own signup
         * reads, and the same event fires, which is what sends the mail. If the firm
         * turns verification on, both halves agree; if off, both let the customer
         * straight in.
         */
        $verificationRequired = (bool) core()->getConfigData('customer.settings.email.verification');

        $customer = Customer::create([
            'first_name'        => $data['first_name'],
            'last_name'         => $data['last_name'] ?? '',
            'email'             => $data['email'],
            'phone'             => $data['phone'] ?? null,
            'password'          => Hash::make($data['password']),
            'api_token'         => Str::random(80),
            'customer_group_id' => CustomerGroup::where('code', 'general')->value('id'),
            'channel_id'        => core()->getCurrentChannel()->id,
            'status'            => 1,
            'is_verified'       => ! $verificationRequired,
            // The token the verification link carries. Bagisto's verifyAccount() looks
            // the customer up by it, so it has to exist before the mail goes out.
            'token'             => md5(uniqid((string) rand(), true)),
        ]);

        Event::dispatch('customer.registration.after', $customer);

        return response()->json([
            'token'                 => $customer->createToken('haatma-okil')->plainTextToken,
            'customer'              => $this->present($customer),
            // So the sign-up screen can say "check your email" rather than sending the
            // customer to a shop that will turn them away.
            'verification_required' => $verificationRequired,
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        $token = PersonalAccessToken::findToken((string) $request->bearerToken());

        if (! $token || ! $token->tokenable instanceof Customer) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        return response()->json(['customer' => $this->present($token->tokenable)]);
    }

    /**
     * Sign in an advocate.
     *
     * Advocates are firm staff, so they are Bagisto **admins** rather than customers.
     * That is what finally closes a gap the old schema could not: `advocates.user_id`
     * existed but nothing was ever able to set it, so no advocate could open an
     * enquiry the firm had already been paid for.
     *
     * Signing in also links the advocate record to the staff account, matching on
     * email. A mistyped address does not error — it simply never matches, and the
     * advocate opens an empty desk — so the desk reports that case explicitly.
     */
    public function adminLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $admin = Admin::where('email', $data['email'])->first();

        if (! $admin || ! Hash::check($data['password'], $admin->password)) {
            return response()->json(['error' => 'invalid_credentials'], 401);
        }

        if (! $admin->status) {
            return response()->json(['error' => 'inactive'], 403);
        }

        $advocateId = DB::select('CALL legal_link_advocate_account(?, ?)', [$admin->id, $admin->email]);

        $admin->tokens()->delete();

        return response()->json([
            'token' => $admin->createToken('haatma-okil-desk')->plainTextToken,
            'admin' => [
                'id'          => $admin->id,
                'name'        => $admin->name,
                'email'       => $admin->email,
                'advocate_id' => $advocateId[0]->result ?? null,
            ],
        ]);
    }

    private function present(Customer $customer): array
    {
        return [
            'id'          => $customer->id,
            'first_name'  => $customer->first_name,
            'last_name'   => $customer->last_name,
            'email'       => $customer->email,
            'phone'       => $customer->phone,
            'is_verified' => (bool) $customer->is_verified,
        ];
    }
}
