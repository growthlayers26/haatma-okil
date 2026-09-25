<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marks which customers rows Google itself vouched for.
 *
 * AuthController::social() used to sign a Google-authenticated visitor straight into
 * whatever customers row already had their email, with no check on how that row got
 * there. That is an account-takeover setup: register()'s email verification is
 * optional (the firm's own choice, in Bagisto's config) and easy to leave off during
 * setup, so an attacker can `auth/register` someone else's address, wait for the
 * real owner to click "Continue with Google," and inherit whatever that owner then
 * stores in the account — while still holding the password themselves. is_verified
 * cannot tell these apart: it is true for both a legitimately verified password
 * account and for any account created while verification was off.
 *
 * This column is the thing that actually can tell them apart, because only
 * social() itself ever sets it, and only at the moment it creates a row. See its
 * use in AuthController::social().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('is_google_linked')->default(false)->after('is_verified');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('is_google_linked');
        });
    }
};
