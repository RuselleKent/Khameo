<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;

class VerificationCodeService
{
    public const PURPOSE = 'email_verification';
    public const TTL_MINUTES = 10;       // how long a code works
    public const MAX_ATTEMPTS = 5;       // wrong tries before lock
    public const LOCK_MINUTES = 5;       // lock length
    public const RESEND_SECONDS = 60;    // wait between emails

    /** @return array{ok:bool, reason?:string, retry_after?:int, locked_until?:int} */
    public function send(User $user): array
    {
        $row = VerificationCode::firstOrNew(['user_id' => $user->id, 'purpose' => self::PURPOSE]);

        if ($row->locked_until && $row->locked_until->isFuture()) {
            return ['ok' => false, 'reason' => 'locked', 'locked_until' => $row->locked_until->getTimestampMs()];
        }
        if ($row->sent_at && $row->sent_at->diffInSeconds(now(), false) < self::RESEND_SECONDS) {
            $wait = self::RESEND_SECONDS - (int) $row->sent_at->diffInSeconds(now());
            return ['ok' => false, 'reason' => 'throttled', 'retry_after' => max(1, $wait)];
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $row->fill([
            'code_hash' => $this->hash($code),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'sent_at' => now(),
            // attempts are NOT reset here, so "Resend" cannot be used to get unlimited guesses
        ])->save();

        Mail::to($user->email)->send(new VerificationCodeMail($code, self::TTL_MINUTES));

        return ['ok' => true];
    }

    /** @return array{ok:bool, reason?:string, message?:string, locked_until?:int} */
    public function verify(User $user, string $code): array
    {
        $row = VerificationCode::where('user_id', $user->id)->where('purpose', self::PURPOSE)->first();

        if (! $row) {
            return $this->invalid();
        }
        if ($row->locked_until && $row->locked_until->isFuture()) {
            return $this->locked($row);
        }
        if ($row->expires_at->isPast()) {
            return ['ok' => false, 'reason' => 'expired', 'message' => 'Code expired. Please request a new one.'];
        }

        if (! hash_equals($row->code_hash, $this->hash($code))) {
            $row->attempts++;
            if ($row->attempts >= self::MAX_ATTEMPTS) {
                $row->attempts = 0;
                $row->locked_until = now()->addMinutes(self::LOCK_MINUTES);
                $row->save();
                return $this->locked($row);
            }
            $row->save();
            return $this->invalid();
        }

        $row->delete();
        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
        return ['ok' => true];
    }

    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, config('app.key'));
    }

    private function invalid(): array
    {
        return ['ok' => false, 'reason' => 'invalid', 'message' => 'Invalid code. Please check and try again.'];
    }

    private function locked(VerificationCode $row): array
    {
        return [
            'ok' => false,
            'reason' => 'locked',
            'message' => 'Too many incorrect attempts. Please wait ' . self::LOCK_MINUTES . ' minutes.',
            'locked_until' => $row->locked_until->getTimestampMs(),
        ];
    }
}
