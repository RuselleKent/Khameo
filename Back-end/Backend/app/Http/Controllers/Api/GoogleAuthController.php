<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GoogleAuthController extends Controller
{
    // The app sends the Google "id_token". Laravel asks Google if it is real.
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['id_token' => ['required', 'string']]);

        $res = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $request->id_token]);
        $info = $res->json();

        $allowed = array_filter(explode(',', (string) config('khameo.google_client_ids')));
        if (! $res->ok() || ! in_array($info['aud'] ?? '', $allowed, true) || ($info['email_verified'] ?? 'false') !== 'true') {
            return response()->json(['message' => 'Google sign-in failed. Please try again.'], 401);
        }

        $email = strtolower($info['email']);
        $user = User::where('google_id', $info['sub'])->orWhere('email', $email)->first();
        $linked = (bool) ($user && ! $user->google_id); // an existing account is now linked to Google

        $user = $user ?? new User(['email' => $email]);
        $user->google_id = $info['sub'];
        $user->email_verified_at = $user->email_verified_at ?? now(); // Google already checked the email
        $user->save();

        return response()->json(['user' => $user->toApi(), 'token' => AuthController::issueToken($user, true), 'linked' => $linked]);
    }
}
