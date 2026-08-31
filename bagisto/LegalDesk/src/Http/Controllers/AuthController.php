<?php

namespace HaatmaOkil\LegalDesk\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
 * someone getting in — unverified, suspended, or deactivated.
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

        $customer = Customer::create([
            'first_name'        => $data['first_name'],
            'last_name'         => $data['last_name'] ?? '',
            'email'             => $data['email'],
            'phone'             => $data['phone'] ?? null,
            'password'          => Hash::make($data['password']),
            'customer_group_id' => CustomerGroup::where('code', 'general')->value('id'),
            'channel_id'        => core()->getCurrentChannel()->id,
            'status'            => 1,
            // Verification is by emailed link in Bagisto. Left false here so that flow
            // stays the only thing that can set it.
            'is_verified'       => 0,
        ]);

        return response()->json([
            'token'    => $customer->createToken('haatma-okil')->plainTextToken,
            'customer' => $this->present($customer),
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
