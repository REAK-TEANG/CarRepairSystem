#!/bin/sh
set -e

PORT="${PORT:-80}"
echo "Configuring Apache for Render on port ${PORT}..."

# Replace port in ports.conf and default virtual host
sed -i "s/Listen [0-9]*/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Apply pending database schema files (idempotent). Never blocks startup.
php /var/www/html/bin/migrate.php || echo "WARNING: schema migration failed; see error above"

# Optional break-glass: set ADMIN_RESET_USERNAME + ADMIN_RESET_PASSWORD in the environment to
# reset that account's password at startup, then REMOVE both variables.
if [ -n "$ADMIN_RESET_USERNAME" ] && [ -n "$ADMIN_RESET_PASSWORD" ]; then
    NEW_PASSWORD="$ADMIN_RESET_PASSWORD" php /var/www/html/bin/set_password.php "$ADMIN_RESET_USERNAME" || echo "WARNING: password reset failed"
fi

exec apache2-foreground
