<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

// Tinatapon kapag hindi naipadala ang email.
// Kusa itong gagawing 503 JSON ng Laravel (dahil sa render() sa baba),
// kaya malinis na message ang makikita ng user, hindi raw error.
class MailFailedException extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => 'We could not send the email. Please try again.',
        ], 503);
    }
}
