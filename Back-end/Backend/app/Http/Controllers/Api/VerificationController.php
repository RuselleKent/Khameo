<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function __construct(private VerificationCodeService $codes) {}

    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ], ['code.digits' => 'Invalid code. Please check and try again.']);

        $user = User::where('email', strtolower(trim($data['email'])))->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid code. Please check and try again.'], 422);
        }

        $result = $this->codes->verify($user, $data['code']);

        if ($result['ok']) {
            return response()->json(['user' => $user->toApi(), 'token' => AuthController::issueToken($user, true)]);
        }
        if ($result['reason'] === 'locked') {
            return response()->json(['message' => $result['message'], 'locked_until' => $result['locked_until']], 429);
        }
        return response()->json(['message' => $result['message'], 'errors' => ['code' => [$result['message']]]], 422);
    }

    public function resend(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower(trim($data['email'])))->first();

        // Same answer whether or not the account exists, so this cannot be used to find emails.
        if (! $user || $user->email_verified_at) {
            return response()->json(['message' => 'If the account needs a code, it was sent.']);
        }

        $result = $this->codes->send($user);
        if (! $result['ok'] && $result['reason'] === 'locked') {
            return response()->json(['message' => 'Too many incorrect attempts. Please wait ' . VerificationCodeService::LOCK_MINUTES . ' minutes.', 'locked_until' => $result['locked_until']], 429);
        }
        if (! $result['ok']) {
            return response()->json(['message' => 'Please wait before asking for another code.', 'retry_after' => $result['retry_after']], 429);
        }
        return response()->json(['message' => 'Verification code sent.']);
    }
}
