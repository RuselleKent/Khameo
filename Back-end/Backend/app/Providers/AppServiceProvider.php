<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Mga "limit" laban sa spam at hula-hula ng password / code.
        // Dalawang bantay bawat isa: per IP at per email.
        // Kapag per IP lang, madaling lusutan ng attacker na maraming IP.

        // Login at verify code: bawal ang sunod-sunod na hula sa iisang account
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(10)->by('ip:' . $request->ip()),
            Limit::perMinute(5)->by('email:' . $this->emailOf($request)),
        ]);

        // Mga route na nagpapadala ng email (register, resend, forgot).
        // Protektado nito ang inbox ng biktima at ang 300 emails/day ng Brevo.
        RateLimiter::for('mail', fn (Request $request) => [
            Limit::perMinute(5)->by('ip:' . $request->ip()),
            Limit::perHour(10)->by('email:' . $this->emailOf($request)),
        ]);
    }

    // Email na galing sa request (lowercase), o walang laman kung wala
    private function emailOf(Request $request): string
    {
        return Str::lower(trim((string) $request->input('email')));
    }
}
