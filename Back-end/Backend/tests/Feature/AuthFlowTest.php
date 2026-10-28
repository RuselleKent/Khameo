<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Sinusubukan dito ang buong login flow, walang totoong email na ipinapadala.
class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // May key na, kaya totoong dadaan sa Brevo code (pero peke ang sagot, tingnan sa baba).
        config(['khameo.brevo_api_key' => 'test-key']);
    }

    // Peke ang Brevo na laging "ok", para makuha natin ang code na "ipinadala".
    private function mailWorks(): void
    {
        Http::fake(['api.brevo.com/*' => Http::response(['messageId' => 'x'], 201)]);
    }

    // Kunin ang 6-digit code sa huling email na ipinadala
    private function lastCode(): string
    {
        $html = '';
        Http::assertSent(function (Request $request) use (&$html) {
            $html = $request['htmlContent'];
            return true;
        });
        preg_match('/\d{6}/', $html, $match);

        return $match[0];
    }

    private function register(string $email = 'kent@example.com'): void
    {
        $this->postJson('/api/register', [
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201);
    }

    public function test_register_verify_then_login(): void
    {
        $this->mailWorks();

        $this->register();

        $this->postJson('/api/verify-code', ['email' => 'kent@example.com', 'code' => $this->lastCode()])
            ->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email'], 'token']);

        $this->postJson('/api/login', ['email' => 'kent@example.com', 'password' => 'password123'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_me_needs_a_token_and_returns_json(): void
    {
        $this->mailWorks();

        $this->getJson('/api/me')->assertStatus(401);

        $this->register();
        $token = $this->postJson('/api/verify-code', ['email' => 'kent@example.com', 'code' => $this->lastCode()])
            ->json('token');

        $this->withToken($token)->getJson('/api/me')->assertOk()->assertJsonPath('user.email', 'kent@example.com');
    }

    public function test_login_errors_are_clear(): void
    {
        $this->mailWorks();

        $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'x'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'No account found with this email.');

        $this->register();

        $this->postJson('/api/login', ['email' => 'kent@example.com', 'password' => 'wrongpass'])
            ->assertStatus(422)->assertJsonPath('errors.password.0', 'Incorrect password. Please try again.');

        // Tama ang password pero hindi pa verified
        $this->postJson('/api/login', ['email' => 'kent@example.com', 'password' => 'password123'])
            ->assertStatus(403)->assertJsonPath('needs_verification', true);
    }

    public function test_password_must_match(): void
    {
        $this->mailWorks();

        $this->postJson('/api/register', [
            'email' => 'kent@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different123',
        ])->assertStatus(422)->assertJsonPath('errors.password.0', 'Password must match.');
    }

    public function test_five_wrong_codes_lock_the_account(): void
    {
        $this->mailWorks();

        $this->register();

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/verify-code', ['email' => 'kent@example.com', 'code' => '000000'])
                ->assertStatus(422);
        }

        $this->postJson('/api/verify-code', ['email' => 'kent@example.com', 'code' => '000000'])
            ->assertStatus(429)->assertJsonStructure(['locked_until']);
    }

    public function test_resend_has_a_60_second_wait(): void
    {
        $this->mailWorks();

        $this->register();

        $this->postJson('/api/resend-code', ['email' => 'kent@example.com'])
            ->assertStatus(429)->assertJsonStructure(['retry_after']);
    }

    public function test_mail_failure_gives_503_and_does_not_start_the_wait(): void
    {
        // Unang request pumalya (500), ang pangalawa ay ok na.
        Http::fake(['api.brevo.com/*' => Http::sequence()
            ->push('nope', 500)
            ->push(['messageId' => 'x'], 201)]);

        $this->postJson('/api/register', [
            'email' => 'kent@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(503)->assertJsonPath('message', 'We could not send the email. Please try again.');

        // Gumagana na ulit ang Brevo, at pwede agad mag-try (walang 60s na hintay)
        $this->postJson('/api/resend-code', ['email' => 'kent@example.com'])->assertOk();
    }

    public function test_forgot_and_reset_password(): void
    {
        $this->mailWorks();

        $this->register();
        $this->postJson('/api/verify-code', ['email' => 'kent@example.com', 'code' => $this->lastCode()])->assertOk();

        $this->postJson('/api/forgot-password', ['email' => 'kent@example.com'])->assertOk();

        // Kunin ang token sa link ng email
        $html = '';
        Http::assertSent(function (Request $request) use (&$html) {
            $html = $request['htmlContent'];
            return true;
        });
        preg_match('/token=([^&"<]+)/', $html, $match);
        $token = urldecode($match[1]);

        // Masyadong maaga ulit mag-request
        $this->postJson('/api/forgot-password', ['email' => 'kent@example.com'])->assertStatus(429);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'kent@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->postJson('/api/login', ['email' => 'kent@example.com', 'password' => 'newpassword123'])->assertOk();

        // Isang gamit lang ang token
        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'kent@example.com',
            'password' => 'another12345',
            'password_confirmation' => 'another12345',
        ])->assertStatus(422);
    }

    public function test_forgot_password_unknown_email(): void
    {
        $this->mailWorks();

        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'])->assertStatus(422);
    }

    public function test_root_does_not_leak_framework_version(): void
    {
        $this->mailWorks();

        $this->getJson('/')->assertOk()->assertExactJson(['app' => 'Khameo API', 'status' => 'ok']);
    }
}
