<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
        ]);
        $email = strtolower(trim($data['email']));

        if (! User::where('email', $email)->exists()) {
            return response()->json(['message' => 'No account found with this email.', 'errors' => ['email' => ['No account found with this email.']]], 422);
        }

        $status = Password::sendResetLink(['email' => $email]);

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => 'Please wait a moment before trying again.'], 429);
        }
        return response()->json(['message' => 'Reset link sent.']);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password must match.',
        ]);
        $data['email'] = strtolower(trim($data['email']));

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete(); // log out every device after a reset
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'This reset link is invalid or expired.'], 422);
        }
        return response()->json(['message' => 'Password updated.']);
    }
}
