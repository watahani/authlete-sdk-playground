FROM golang:1.24.2-bookworm

# https://code.visualstudio.com/remote/advancedcontainers/add-nonroot-user#_creating-a-nonroot-user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID \
               --gid $USER_GID \
               --shell /bin/bash \
               --create-home \
               $USERNAME \

    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && mkdir -p /etc/sudoers.d \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

USER $USERNAME
WORKDIR /workspaces/go

# Place module files in a writable workspace owned by the user
COPY --chown=${USERNAME}:${USER_GID} go.mod go.sum ./

# install modules for cache
RUN go mod download

# install dlv for debugging
RUN go install github.com/go-delve/delve/cmd/dlv@latest
