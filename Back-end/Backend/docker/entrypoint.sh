#!/bin/sh
# Tumatakbo ito tuwing mag-start ang app sa Render.

# Render ang nagbibigay ng PORT (usually 10000). Ipinapa-listen natin ang Apache dito.
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

cd /var/www/html

# Gumawa / i-update ang tables sa Supabase.
# Kapag pumalya, ilalabas ang error sa Logs pero tuloy pa rin ang app (para makita mo ang problema).
php artisan migrate --force || echo "WARNING: migrate failed. Check DB_* settings in Render."

# I-on ang Row Level Security sa lahat ng tables (proteksyon sa Supabase)
php artisan khameo:enable-rls || echo "WARNING: could not enable RLS."

# Linis: burahin ang expired na login tokens at lumang reset tokens (para hindi dumami sa database)
php artisan sanctum:prune-expired --hours=24 || true
php artisan auth:clear-resets || true

# Pabilisin ang app sa production
php artisan config:cache
php artisan route:cache

exec apache2-foreground
