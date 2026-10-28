<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

// Supabase: kapag naka-off ang RLS, puwedeng mabasa ng kahit sino ang tables
// gamit ang public Supabase API. Si Laravel lang dapat ang makakagamit.
// Si Laravel ay nakakonekta bilang "postgres" kaya hindi siya naaapektuhan ng RLS.
// Tinatakbo ito sa bawat deploy para kahit bagong table, protektado agad.
class EnableRowLevelSecurity extends Command
{
    protected $signature = 'khameo:enable-rls';
    protected $description = 'Turn on Row Level Security for every table (Supabase only)';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->info('Not Postgres. Skipping RLS.');
            return self::SUCCESS;
        }

        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");

        foreach ($tables as $table) {
            // Ang tablename ay galing mismo sa database, kaya safe ito.
            DB::statement('ALTER TABLE "public"."' . $table->tablename . '" ENABLE ROW LEVEL SECURITY');
            $this->line('RLS on: ' . $table->tablename);
        }

        return self::SUCCESS;
    }
}
