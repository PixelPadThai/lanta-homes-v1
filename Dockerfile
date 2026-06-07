FROM php:8.3-apache

# Serve the repo as-is: / -> coming-soon index.html, /ot265/ -> listing.
COPY . /var/www/html/

# Apache's mod_dir (DirectorySlash, on by default) 301-redirects directory
# requests missing a trailing slash, e.g. /ot265 -> /ot265/. This is what
# makes the QR-code URL without a trailing slash work in production.
# deflate/expires/headers drive gzip compression + cache lifetimes (see perf.conf).
RUN a2enmod dir rewrite deflate expires headers \
    # Allow Apache (www-data) to write lang.json and its temp file.
    && chown www-data:www-data /var/www/html/ot265 /var/www/html/ot265/lang.json \
    # Create the json-edit backups dir and make it writable.
    && mkdir -p /var/www/html/json-edit/php/backups \
    && chown -R www-data:www-data /var/www/html/json-edit/php/backups

# Performance: gzip text assets + far-future caching for static files.
# Written to conf-available (kept out of the web root) and enabled with a2enconf.
RUN cat > /etc/apache2/conf-available/perf.conf <<'EOF'
# ── Gzip compression (skips already-compressed woff2/jpg/png/mp4) ──
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css \
    text/javascript application/javascript application/json \
    image/svg+xml application/manifest+json
</IfModule>

# Ensure woff2 has a stable MIME type for the cache rule below.
<IfModule mod_mime.c>
  AddType font/woff2 .woff2
</IfModule>

# ── Cache lifetimes ──
<IfModule mod_expires.c>
  ExpiresActive On

  # Versioned static assets (CSS/JS carry ?v=N, fonts/images change by name) —
  # safe to cache long; a content change bumps the URL.
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/jpeg "access plus 6 months"
  ExpiresByType image/png "access plus 6 months"
  ExpiresByType image/webp "access plus 6 months"
  ExpiresByType image/svg+xml "access plus 6 months"
  ExpiresByType image/x-icon "access plus 6 months"
  ExpiresByType video/mp4 "access plus 6 months"

  # HTML + lang.json change on deploy without a cache-buster — always revalidate.
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
</IfModule>
EOF
RUN a2enconf perf

EXPOSE 80
