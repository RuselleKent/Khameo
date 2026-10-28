<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Isang row = isang code na naghihintay ma-verify (bawat user).
class VerificationCode extends Model
{
    protected $fillable = ['user_id', 'purpose', 'code_hash', 'expires_at', 'attempts', 'locked_until', 'sent_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'locked_until' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }
}
