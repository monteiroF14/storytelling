FROM oven/bun:latest AS base

RUN apt-get update && apt-get install -y curl && apt-get clean

WORKDIR /app

COPY ./package.json ./bun.lockb ./

COPY ./packages/interface ./packages/interface
COPY ./packages/types ./packages/types

RUN bun install --scope=interface --scope=types

WORKDIR /app/packages/interface

EXPOSE 5555

CMD ["bun", "run", "dev"]
