<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Supabase makes every table in the "public" schema reachable through its own web API.
// Turning on Row Level Security (with no policies) closes that door.
// Laravel still works because it connects with the postgres role, which skips RLS.
// This file is dated last on purpose so it runs after every other table exists.
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false");
        foreach ($tables as $t) {
            DB::statement('ALTER TABLE "public"."' . $t->tablename . '" ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        // Nothing to undo. Leaving RLS on is the safe state.
    }
};
