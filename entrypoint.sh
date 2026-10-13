#!/bin/sh
set -e

PORT="${PORT:-80}"
echo "Configuring Apache for Render on port ${PORT}..."

# Replace port in ports.conf and default virtual host
sed -i "s/Listen [0-9]*/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
