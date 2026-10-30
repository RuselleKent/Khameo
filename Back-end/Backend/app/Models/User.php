<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['email', 'password'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // kapag nag-save ng plain password, kusa itong ha-hash
        ];
    }

    public function verificationCodes(): HasMany
    {
        return $this->hasMany(VerificationCode::class);
    }

    // Laging lowercase at walang space ang email
    public function setEmailAttribute(string $value): void
    {
        $this->attributes['email'] = self::cleanEmail($value);
    }

    public static function cleanEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    // Hanapin ang user gamit ang email (kahit malaki ang letters o may space)
    public static function findByEmail(string $email): ?self
    {
        return self::where('email', self::cleanEmail($email))->first();
    }

    // Ito lang ang ipinapakita sa app (walang password o iba pang sensitive).
    public function toApi(): array
    {
        return ['id' => $this->id, 'email' => $this->email];
    }
}
