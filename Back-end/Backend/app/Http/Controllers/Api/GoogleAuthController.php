<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

// Google sign-in. Ang app ang nagpapadala ng "id_token" galing Google.
// Si Laravel ang nagtatanong sa Google kung totoo ito.
// (Hindi pa ito gamit sa app, pero ready na ang backend.)
class GoogleAuthController extends Controller
{
    // POST /api/auth/google
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['id_token' => ['required', 'string']]);

        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->input('id_token'),
            ]);
        } catch (Throwable $e) {
            Log::error('Google tokeninfo failed: ' . $e->getMessage());
            return response()->json(['message' => 'Google sign-in is not available right now.'], 503);
        }
        $info = $response->json();

        // Para sa Khameo lang dapat ang token, at verified ang email.
        $allowedIds = array_filter(explode(',', (string) config('khameo.google_client_ids')));
        $isForUs = in_array($info['aud'] ?? '', $allowedIds, true);
        $emailOk = ($info['email_verified'] ?? 'false') === 'true';

        if (! $response->ok() || ! $isForUs || ! $emailOk) {
            return response()->json(['message' => 'Google sign-in failed. Please try again.'], 401);
        }

        $user = User::where('google_id', $info['sub'])->first() ?? User::findByEmail($info['email']);
        $linked = (bool) ($user && ! $user->google_id); // dating account, ngayon naka-link na sa Google

        $user ??= new User(['email' => $info['email']]);

        // Hindi pa verified ang account na ito, kaya baka ibang tao ang nag-set ng password
        // (nag-register siya gamit ang email ng iba). Burahin ang password para
        // hindi makapasok ang taong iyon sa account na ito.
        if (! $user->email_verified_at) {
            $user->password = null;
        }

        $user->google_id = $info['sub'];
        $user->email_verified_at ??= now(); // Google na ang nag-verify
        $user->save();

        return response()->json([
            'user' => $user->toApi(),
            'token' => AuthController::issueToken($user, true),
            'linked' => $linked,
        ]);
    }
}
