#!/bin/sh
set -e

PORT="${PORT:-80}"
echo "Configuring Apache for Render on port ${PORT}..."

# Replace port in ports.conf and default virtual host
sed -i "s/Listen [0-9]*/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Start Ratchet WebSocket server daemon in background if available
if [ -f "/var/www/html/api/websocket_server.php" ]; then
    echo "Starting background WebSocket real-time daemon on port ${WS_PORT:-8080}..."
    WS_PORT="${WS_PORT:-8080}" php /var/www/html/api/websocket_server.php &
fi

exec apache2-foreground
