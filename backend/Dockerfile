# 使用多階段構建
# 第一階段：構建基礎 PHP 環境
FROM php:8.1-fpm as php-base

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql zip

# 安裝 Redis 擴展
RUN pecl install redis && docker-php-ext-enable redis

# 安裝 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 第二階段：構建 AI 環境
FROM php-base as ai-base

# 安裝 Python 和相關工具
RUN apt-get install -y \
    python3 \
    python3-pip \
    python3-opencv \
    && ln -s /usr/bin/python3 /usr/bin/python

# 安裝 AI 相關 Python 包
COPY backend/ai/requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# 最終階段：組合所有內容
FROM ai-base as final

# 設置工作目錄
WORKDIR /var/www/html

# 複製應用程序文件
COPY backend/ .

# 安裝 PHP 依賴
RUN composer install --no-dev --optimize-autoloader

# 設置權限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# 暴露端口
EXPOSE 9000

# 啟動 PHP-FPM
CMD ["php-fpm"] 