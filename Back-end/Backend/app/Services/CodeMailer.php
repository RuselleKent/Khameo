<?php

namespace App\Services;

use App\Exceptions\MailFailedException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

// Taga-send ng email. Dalawa lang ang email natin:
// 1) 6-digit verification code   2) reset password link
class CodeMailer
{
    public function sendVerificationCode(string $email, string $code, int $minutes): void
    {
        $html = '<p>Your Khameo verification code is:</p>'
            . '<h1 style="letter-spacing:6px">' . e($code) . '</h1>'
            . '<p>This code expires in ' . $minutes . ' minutes. '
            . 'If you did not ask for it, you can ignore this email.</p>';

        $this->deliver($email, 'Your Khameo verification code', $html, "Verification code for {$email}: {$code}");
    }

    public function sendResetLink(string $email, string $url, string $token): void
    {
        $html = '<p>We got a request to reset your Khameo password.</p>'
            . '<p><a href="' . e($url) . '">Reset my password</a></p>'
            . '<p>Using the app? Open Reset Password and paste this reset code:</p>'
            . '<p><b>' . e($token) . '</b></p>'
            . '<p>If you did not ask for this, you can ignore this email.</p>';

        $this->deliver($email, 'Reset your Khameo password', $html, "Reset link for {$email}: {$url}");
    }

    private function deliver(string $to, string $subject, string $html, string $logText): void
    {
        $apiKey = config('khameo.brevo_api_key');

        // Local dev: walang Brevo key, i-log na lang para makita mo ang code.
        if (! $apiKey) {
            Log::info('[MAIL not sent, no BREVO_API_KEY] ' . $logText);
            return;
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders(['api-key' => $apiKey])
                ->acceptJson()
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => [
                        'name' => config('khameo.mail_from_name'),
                        'email' => config('khameo.mail_from_address'),
                    ],
                    'to' => [['email' => $to]],
                    'subject' => $subject,
                    'htmlContent' => $html,
                ]);
        } catch (Throwable $e) {
            // Network error, timeout, etc.
            Log::error('Brevo request failed: ' . $e->getMessage());
            throw new MailFailedException('Brevo request failed.', 0, $e);
        }

        if (! $response->successful()) {
            // Ang totoong dahilan, sa log lang. Hindi ito pinapakita sa user.
            Log::error('Brevo said no: ' . $response->status() . ' ' . $response->body());
            throw new MailFailedException('Brevo rejected the email.');
        }
    }
}
