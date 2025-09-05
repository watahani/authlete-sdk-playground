FROM php:8.3-cli-bookworm

# Install tools and extensions commonly needed for Composer and debugging
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git curl unzip zip \
    && rm -rf /var/lib/apt/lists/*

# Install Xdebug for VS Code debugging
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Configure Xdebug (VS Code default port 9003)
# docker-php-ext-enable already creates a loader ini for xdebug.
# Only add runtime settings here to avoid brittle hardcoded paths.
RUN { \
  echo "xdebug.mode=debug"; \
  echo "xdebug.start_with_request=yes"; \
  echo "xdebug.client_host=host.docker.internal"; \
  echo "xdebug.client_port=9003"; \
} > /usr/local/etc/php/conf.d/zz-xdebug.ini

# Create a non-root user similar to other language samples
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID --shell /bin/bash --create-home $USERNAME \
    && apt-get update \
    && apt-get install -y sudo \
    && mkdir -p /etc/sudoers.d \
    && echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && rm -rf /var/lib/apt/lists/*

USER $USERNAME
WORKDIR /workspaces/php

# Install Composer (copy from official composer image)
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Pre-create Composer dirs
RUN mkdir -p /home/$USERNAME/.composer \
    && composer --version
