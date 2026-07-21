FROM ruby:3.4-slim-bookworm

# Install tools commonly needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-install gems for faster container startup (run as root to write to system gem path).
# The lockfile is included so the baked gems match it exactly and a later
# `bundle install` does not need to write to the system gem path.
COPY Gemfile Gemfile.lock /tmp/
RUN cd /tmp && bundle install

# Create a non-root user similar to other language samples.
# Permissions (not ownership) open up the gem path so the user keeps write
# access even when the dev container remaps its UID (e.g. on CI runners).
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID --shell /bin/bash --create-home $USERNAME \
    && chmod -R a+rwX /usr/local/bundle

USER $USERNAME
WORKDIR /workspaces/ruby-v2
