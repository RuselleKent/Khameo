<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\VerificationController;
use Illuminate\Support\Facades\Route;

// Lahat ng route dito may prefix na /api (hal. POST /api/login).
// Ang "throttle:login" at "throttle:mail" ay nasa AppServiceProvider.

// --- Public (hindi kailangan ng token) ---
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:mail');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::post('/verify-code', [VerificationController::class, 'verify'])->middleware('throttle:login');
Route::post('/resend-code', [VerificationController::class, 'resend'])->middleware('throttle:mail');

Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:mail');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:login');

Route::post('/auth/google', GoogleAuthController::class)->middleware('throttle:10,1');

// --- Kailangan ng token (Authorization: Bearer ...) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
