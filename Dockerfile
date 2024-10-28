# Use Bun official image
FROM oven/bun:latest AS base

ENV LLAMA_API_URL=http://llama:11343

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory
WORKDIR /app

# Copy only the necessary package.json and bun.lockb files from root
COPY ./package.json ./bun.lockb ./

# Copy only the server and types packages into the build context
COPY ./packages/server ./packages/server
COPY ./packages/types ./packages/types

# Install dependencies only for the `server` and `types`
RUN bun install --scope=server --scope=types

# Set the working directory to server
WORKDIR /app/packages/server

# Expose the necessary port (adjust if needed)
EXPOSE 3000

# Start the Bun server
CMD ["bun", "run", "dev"]
