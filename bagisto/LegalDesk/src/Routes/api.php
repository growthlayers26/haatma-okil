<?php

use Illuminate\Support\Facades\Route;
use HaatmaOkil\LegalDesk\Http\Controllers\AuthController;
use HaatmaOkil\LegalDesk\Http\Controllers\MailController;

/*
 * The only PHP surface the Next.js application calls.
 *
 * It is deliberately this small. Identity is the one thing Bagisto must own outright
 * — account status, suspension, verification and password hashing all live here — so
 * signing in goes through Bagisto. Everything else the application needs, it reads
 * from the same MySQL database directly.
 *
 * Every route that takes a password or creates an account is throttled. None of them
 * were before: nothing stood between an attacker and unlimited password guesses
 * against a customer account or, worse, an advocate's — the desk holds privileged
 * client detail, and Laravel's own default login throttling (RouteServiceProvider's
 * "login" limiter) never applied here because these routes never go through it.
 * Keyed by IP, Laravel's default for `throttle:max,minutes`.
 */
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('auth/social', [AuthController::class, 'social'])->middleware('throttle:20,1');
Route::get('auth/me', [AuthController::class, 'me']);

// The advocate desk. Advocates are staff, so they sign in as Bagisto admins.
// Tighter than the customer login: fewer accounts exist, so fewer legitimate
// attempts are ever needed, and each one guards a firm's whole client list.
Route::post('auth/admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');

// Delivery for the notification queue. Behind a shared secret — see MailController.
Route::post('mail/send', [MailController::class, 'send']);
