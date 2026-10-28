<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('purpose')->default('email_verification');
            $table->string('code_hash');                         // hindi sine-save ang mismong code, hash lang
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempts')->default(0); // bilang ng maling try
            $table->timestamp('locked_until')->nullable();       // may laman kapag na-lock
            $table->timestamp('sent_at')->nullable();            // para sa 60 seconds na hintay sa Resend
            $table->timestamps();

            $table->unique(['user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};
