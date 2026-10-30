<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\MailFailedException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

// Register, login, logout, at "sino ako" (me).
class AuthController extends Controller
{
    public function __construct(private VerificationCodeService $codes) {}

    // POST /api/register
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:64', 'confirmed'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.max' => 'Password must be 64 characters or less.',
            'password.confirmed' => 'Password must match.',
        ]);

        $user = User::findByEmail($data['email']);

        // May verified na account na gamit ang email na ito
        if ($user?->email_verified_at) {
            return $this->fieldError('email', 'Email is already taken.');
        }

        // Kapag may account pero hindi pa verified, pwede ulitin ang signup (bagong password).
        $user ??= new User(['email' => $data['email']]);
        $user->password = $data['password']; // kusang naha-hash dahil sa model
        $user->save();

        // Kapag pumalya ang email, 503 ang sagot (tingnan ang MailFailedException).
        $this->codes->send($user);

        return response()->json(['message' => 'Verification code sent.', 'email' => $user->email], 201);
    }

    // POST /api/login
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Enter a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        $user = User::findByEmail($data['email']);

        if (! $user) {
            return $this->fieldError('email', 'No account found with this email.');
        }

        // Walang password = Google-only account, kaya hindi puwedeng mag-login gamit password.
        if (! $user->password || ! Hash::check($data['password'], $user->password)) {
            return $this->fieldError('password', 'Incorrect password. Please try again.');
        }

        // Tama ang password pero hindi pa verified ang email
        if (! $user->email_verified_at) {
            try {
                $this->codes->send($user);
            } catch (MailFailedException $e) {
                // Hindi natin hinaharang ang user dito. Makikita pa rin niya ang verify screen.
                Log::warning('Could not resend code on login: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Please verify your email first.',
                'needs_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        return response()->json([
            'user' => $user->toApi(),
            'token' => self::issueToken($user, (bool) ($data['remember'] ?? false)),
        ]);
    }

    // GET /api/me (kailangan ng token)
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toApi()]);
    }

    // POST /api/logout (kailangan ng token)
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    // Gumawa ng token. Ginagamit din ng verify-code at google login.
    // "Remember me" = 30 days, kung hindi = 1 day.
    public static function issueToken(User $user, bool $remember): string
    {
        $expires = $remember ? now()->addDays(30) : now()->addDay();

        return $user->createToken('mobile', ['*'], $expires)->plainTextToken;
    }
}
