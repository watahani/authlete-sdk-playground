FROM ruby:3.4-slim-bookworm

# Install tools commonly needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git curl \
    && rm -rf /var/lib/apt/lists/*

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
WORKDIR /workspaces/ruby-v2

# Pre-install gems for faster container startup
COPY --chown=$USERNAME Gemfile .
RUN bundle install
