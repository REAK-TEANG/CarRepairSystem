# Multi-stage or optimized single-stage PHP 8.3 Apache image
FROM php:8.3-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies & PostgreSQL development libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    git \
    unzip \
    libzip-dev \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions: pdo, pdo_pgsql, pgsql, opcache
RUN docker-php-ext-install pdo pdo_pgsql pgsql opcache

# Enable Apache modules: rewrite, headers
RUN a2enmod rewrite headers

# Configure Apache virtual host directory permissions
RUN { \
    echo '<Directory /var/www/html>'; \
    echo '    Options -Indexes +FollowSymLinks'; \
    echo '    AllowOverride All'; \
    echo '    Require all granted'; \
    echo '</Directory>'; \
} >> /etc/apache2/apache2.conf

# Install Composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer files and install PHP dependencies
COPY api/composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Copy the entire API application code into Apache DocumentRoot
COPY api/ ./

# Copy entrypoint script and make executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

# Set correct ownership for Apache web server
RUN chown -R www-data:www-data /var/www/html

# Expose standard web ports
EXPOSE 80 10000

# Use dynamic port entrypoint
ENTRYPOINT ["/entrypoint.sh"]
