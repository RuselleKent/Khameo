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
            $table->string('code_hash');                         // the code is never saved as plain text
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempts')->default(0); // wrong tries
            $table->timestamp('locked_until')->nullable();       // set after too many wrong tries
            $table->timestamp('sent_at')->nullable();            // for the "Resend in 00:59" limit
            $table->timestamps();

            $table->unique(['user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};
