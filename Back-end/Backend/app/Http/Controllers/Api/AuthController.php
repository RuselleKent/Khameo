<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function __construct(private VerificationCodeService $codes) {}

    public function register(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), [
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password must match.',
        ])->validate();

        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if ($user && $user->email_verified_at) {
            return response()->json(['message' => 'Email is already taken.', 'errors' => ['email' => ['Email is already taken.']]], 422);
        }

        // An unverified account that was never finished can be started again.
        $user = $user ?? new User(['email' => $email]);
        $user->password = $data['password'];
        $user->save();

        $this->codes->send($user);

        return response()->json(['message' => 'Verification code sent.', 'email' => $user->email], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), [
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
            'password.required' => 'Password is required.',
        ])->validate();

        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if (! $user) {
            return response()->json(['message' => 'No account found with this email.', 'errors' => ['email' => ['No account found with this email.']]], 422);
        }
        if (! $user->password || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Incorrect password. Please try again.', 'errors' => ['password' => ['Incorrect password. Please try again.']]], 422);
        }
        if (! $user->email_verified_at) {
            $this->codes->send($user); // quietly ignored if the resend limit is active
            return response()->json(['message' => 'Please verify your email first.', 'needs_verification' => true, 'email' => $user->email], 403);
        }

        return $this->tokenResponse($user, (bool) ($data['remember'] ?? false));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toApi()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    /** Shared by login, verify-code and google. */
    public static function issueToken(User $user, bool $remember): string
    {
        $expires = $remember ? now()->addDays(30) : now()->addDay();
        return $user->createToken('mobile', ['*'], $expires)->plainTextToken;
    }

    private function tokenResponse(User $user, bool $remember): JsonResponse
    {
        return response()->json(['user' => $user->toApi(), 'token' => self::issueToken($user, $remember)]);
    }
}
