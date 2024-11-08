FROM oven/bun:latest AS base

RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

COPY ./package.json ./bun.lockb ./

RUN bun install --scope=server --scope=types

WORKDIR /app/packages/server

EXPOSE 3000

CMD ["bun", "run", "dev"]
