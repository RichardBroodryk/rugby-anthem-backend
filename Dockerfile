# syntax = docker/dockerfile:1

ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app
ENV NODE_ENV=production

# ================= BUILD STAGE =================
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      node-gyp \
      pkg-config \
      python-is-python3

COPY package-lock.json package.json ./
RUN npm ci

COPY . .

# ================= FINAL STAGE =================
FROM base

COPY --from=build /app /app

# Match fly.toml internal_port and server.js PORT
EXPOSE 4000

CMD ["npm", "run", "start"]