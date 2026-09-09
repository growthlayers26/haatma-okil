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
 */
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);
Route::get('auth/me', [AuthController::class, 'me']);

// The advocate desk. Advocates are staff, so they sign in as Bagisto admins.
Route::post('auth/admin/login', [AuthController::class, 'adminLogin']);

// Delivery for the notification queue. Behind a shared secret — see MailController.
Route::post('mail/send', [MailController::class, 'send']);
