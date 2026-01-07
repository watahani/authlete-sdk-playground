FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

WORKDIR /workspaces/typescript

# Pre-install dependencies for faster container start
COPY package*.json tsconfig.json ./
RUN npm install
