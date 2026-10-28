<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

// Google sign-in. Ang app ang nagpapadala ng "id_token" galing Google.
// Si Laravel ang nagtatanong sa Google kung totoo ito.
// (Hindi pa ito gamit sa app, pero ready na ang backend.)
class GoogleAuthController extends Controller
{
    // POST /api/auth/google
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['id_token' => ['required', 'string']]);

        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->input('id_token'),
        ]);
        $info = $response->json();

        // Para sa Khameo lang dapat ang token, at verified ang email.
        $allowedIds = array_filter(explode(',', (string) config('khameo.google_client_ids')));
        $isForUs = in_array($info['aud'] ?? '', $allowedIds, true);
        $emailOk = ($info['email_verified'] ?? 'false') === 'true';

        if (! $response->ok() || ! $isForUs || ! $emailOk) {
            return response()->json(['message' => 'Google sign-in failed. Please try again.'], 401);
        }

        $email = strtolower($info['email']);
        $user = User::where('google_id', $info['sub'])->orWhere('email', $email)->first();
        $linked = (bool) ($user && ! $user->google_id); // dating account, ngayon naka-link na sa Google

        $user = $user ?? new User(['email' => $email]);
        $user->google_id = $info['sub'];
        $user->email_verified_at = $user->email_verified_at ?? now(); // Google na ang nag-verify
        $user->save();

        return response()->json([
            'user' => $user->toApi(),
            'token' => AuthController::issueToken($user, true),
            'linked' => $linked,
        ]);
    }
}
