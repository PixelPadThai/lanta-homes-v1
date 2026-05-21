FROM php:8.3-apache

# Serve the repo as-is: / -> coming-soon index.html, /ot265/ -> listing.
COPY . /var/www/html/

# Apache's mod_dir (DirectorySlash, on by default) 301-redirects directory
# requests missing a trailing slash, e.g. /ot265 -> /ot265/. This is what
# makes the QR-code URL without a trailing slash work in production.
RUN a2enmod dir rewrite

EXPOSE 80
