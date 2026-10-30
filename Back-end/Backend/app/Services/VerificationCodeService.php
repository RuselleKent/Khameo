<?php

namespace App\Services;

use App\Exceptions\MailFailedException;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\DB;

// Dito lahat ng rules ng 6-digit code: gawa, padala, at check.
class VerificationCodeService
{
    public const PURPOSE = 'email_verification';
    public const TTL_MINUTES = 10;     // ilang minuto bago mag-expire ang code
    public const MAX_ATTEMPTS = 5;     // ilang maling try bago ma-lock
    public const LOCK_MINUTES = 5;     // gaano katagal ang lock
    public const RESEND_SECONDS = 60;  // hintay bago makapag-resend

    public function __construct(private CodeMailer $mailer) {}

    /**
     * Gumawa at magpadala ng bagong code.
     *
     * @return array{ok:bool, reason?:string, retry_after?:int, locked_until?:int}
     * @throws MailFailedException kapag hindi naipadala ang email
     */
    public function send(User $user): array
    {
        $row = VerificationCode::firstOrNew(['user_id' => $user->id, 'purpose' => self::PURPOSE]);

        // Naka-lock ba siya dahil sa maraming maling try?
        if ($row->locked_until && $row->locked_until->isFuture()) {
            return ['ok' => false, 'reason' => 'locked', 'locked_until' => $row->locked_until->getTimestampMs()];
        }

        // Masyado pang maaga mag-resend?
        if ($row->sent_at) {
            $secondsSince = (int) $row->sent_at->diffInSeconds(now(), true);
            if ($secondsSince < self::RESEND_SECONDS) {
                return ['ok' => false, 'reason' => 'throttled', 'retry_after' => self::RESEND_SECONDS - $secondsSince];
            }
        }

        $oldSentAt = $row->sent_at;
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Hash lang ang sine-save, hindi ang mismong code.
        // Hindi ni-reset ang "attempts" dito para hindi magamit ang Resend sa unlimited hula.
        $row->fill([
            'code_hash' => $this->hash($code),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'sent_at' => now(),
        ])->save();

        try {
            $this->mailer->sendVerificationCode($user->email, $code, self::TTL_MINUTES);
        } catch (MailFailedException $e) {
            // Hindi naipadala, kaya wag i-count ang 60 seconds na hintay.
            $row->forceFill(['sent_at' => $oldSentAt])->save();
            throw $e;
        }

        return ['ok' => true];
    }

    /**
     * I-check ang code na tinype ng user.
     *
     * @return array{ok:bool, reason?:string, message?:string, locked_until?:int}
     */
    public function verify(User $user, string $code): array
    {
        // Naka-lock ang row habang tinitingnan, para hindi malusutan ng
        // sabay-sabay na hula ang limit na 5 tries.
        return DB::transaction(function () use ($user, $code) {
            $row = VerificationCode::where('user_id', $user->id)
                ->where('purpose', self::PURPOSE)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                return $this->invalid();
            }
            if ($row->locked_until && $row->locked_until->isFuture()) {
                return $this->locked($row);
            }
            if ($row->expires_at->isPast()) {
                return ['ok' => false, 'reason' => 'expired', 'message' => 'Code expired. Please request a new one.'];
            }

            // Mali ang code
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

            // Tama! Burahin ang code (isang gamit lang) at i-mark na verified.
            $row->delete();
            if (! $user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            return ['ok' => true];
        });
    }

    // HMAC gamit ang APP_KEY, kaya hindi mahuhulaan ang hash kahit makuha ang database.
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
