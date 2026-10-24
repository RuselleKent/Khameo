<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class VerificationCodeMail extends Mailable
{
    public function __construct(public string $code, public int $minutes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Khameo verification code');
    }

    public function content(): Content
    {
        // Plain text for now. Swap for a designed template later.
        return new Content(text: 'emails.verification-code');
    }
}
