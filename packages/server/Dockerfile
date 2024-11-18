FROM oven/bun:latest AS base

RUN apt-get update && apt-get install -y curl && apt-get clean

WORKDIR /app

COPY ./package.json ./bun.lockb ./

COPY ./packages/server ./packages/server
COPY ./packages/types ./packages/types

RUN bun install --scope=server --scope=types

WORKDIR /app/packages/server

EXPOSE 3000

CMD ["bun", "run", "dev"]
