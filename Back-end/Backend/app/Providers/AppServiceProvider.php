<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // The reset email opens the APP, not a Laravel web page.
        // FRONTEND_RESET_URL examples:  khameo://reset-password   or   http://localhost:8081/reset-password
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $base = config('khameo.frontend_reset_url');
            return $base . '?token=' . urlencode($token) . '&email=' . urlencode($user->email);
        });
    }
}
