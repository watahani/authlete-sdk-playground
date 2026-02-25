FROM ruby:3.4-slim-bookworm

# Install tools commonly needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user similar to other language samples
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID --shell /bin/bash --create-home $USERNAME

USER $USERNAME
WORKDIR /workspaces/ruby-v2

# Pre-install gems for faster container startup
COPY --chown=$USERNAME Gemfile .
RUN bundle install
