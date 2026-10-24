# Khameo API (Laravel + Supabase Postgres)

Backend for login, register, 6-digit email code, forgot/reset password, and Google sign-in.
Supabase is only the database. Laravel does all the login logic.

## Setup (once)

1. Make a Laravel project (version 11 or 12):
   `composer create-project laravel/laravel khameo-api`
2. In the project: `php artisan install:api`  (adds Sanctum + `routes/api.php`)
3. **Delete** `database/migrations/0001_01_01_000000_create_users_table.php` (ours replaces it).
4. Copy everything from this folder into the project. Replace files if asked.
   (`bootstrap/app.php` is not touched. `install:api` already set it up.)
5. Copy the lines from `.env.example.khameo` into your `.env` and fill in your Supabase values.
6. `php artisan migrate`
7. `php artisan serve --host=0.0.0.0`

## Supabase notes

- Use the **Session pooler** (port 5432) in `DB_HOST`. The direct host only works on IPv6 networks.
- Do not use port 6543 (transaction pooler) for migrations.
- The last migration turns on Row Level Security for every table. It blocks Supabase's public API from reading your users. Laravel still works. Run `php artisan migrate` again after you add new tables, or add `ENABLE ROW LEVEL SECURITY` in each new migration.

## Tables

| Table | Purpose |
|---|---|
| `users` | email (lowercase), password (hashed, empty for Google-only), google_id, email_verified_at |
| `verification_codes` | hashed 6-digit code, expires_at, attempts, locked_until, sent_at |
| `password_reset_tokens` | Laravel reset tokens |
| `personal_access_tokens` | login tokens (Sanctum) |

## Endpoints (all under `/api`)

| Method | URL | Body | Answer |
|---|---|---|---|
| POST | /register | email, password, password_confirmation | 201, sends code |
| POST | /verify-code | email, code | `{user, token}` |
| POST | /resend-code | email | 200 / 429 |
| POST | /login | email, password, remember | `{user, token}` or 403 `needs_verification` |
| POST | /forgot-password | email | 200 |
| POST | /reset-password | token, email, password, password_confirmation | 200 |
| POST | /auth/google | id_token | `{user, token, linked}` |
| GET | /me | (token) | `{user}` |
| POST | /logout | (token) | 200 |

Errors use Laravel's format: `{ "message": "...", "errors": { "email": ["..."] } }`.
Lockout answers 429 with `locked_until` (milliseconds).

## Rules (change in `app/Services/VerificationCodeService.php`)

Code works 10 minutes. 5 wrong tries lock for 5 minutes. A new code can be sent every 60 seconds.

## Testing without email

With `MAIL_MAILER=log`, open `storage/logs/laravel.log` and find the code or the reset link.
