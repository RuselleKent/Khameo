<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\MailFailedException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CodeMailer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

// Forgot password at reset password.
class PasswordResetController extends Controller
{
    public function __construct(private CodeMailer $mailer) {}

    // POST /api/forgot-password
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
        ]);

        $user = User::findByEmail($data['email']);

        if (! $user) {
            return $this->fieldError('email', 'No account found with this email.');
        }

        // Gamit natin ang password broker ng Laravel para sa token (ligtas at may expiry).
        $broker = Password::broker();

        // Kakapadala lang? Pahintayin muna (hindi pwedeng spam).
        if ($broker->getRepository()->recentlyCreatedToken($user)) {
            return response()->json(['message' => 'Please wait a moment before trying again.'], 429);
        }

        $token = $broker->createToken($user);
        $url = config('khameo.frontend_reset_url')
            . '?token=' . urlencode($token)
            . '&email=' . urlencode($user->email);

        try {
            $this->mailer->sendResetLink($user->email, $url, $token);
        } catch (MailFailedException $e) {
            $broker->deleteToken($user); // para makapag-try ulit agad
            throw $e;
        }

        return response()->json(['message' => 'Reset link sent.']);
    }

    // POST /api/reset-password
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'max:64', 'confirmed'],
        ], [
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.max' => 'Password must be 64 characters or less.',
            'password.confirmed' => 'Password must match.',
        ]);
        $data['email'] = User::cleanEmail($data['email']);

        // Tinitingnan ng Laravel kung tama at hindi pa expired ang token.
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete(); // i-logout ang lahat ng device pagkatapos mag-reset
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'This reset link is invalid or expired.'], 422);
        }

        return response()->json(['message' => 'Password updated.']);
    }
}
