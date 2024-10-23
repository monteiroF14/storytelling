# Use a base image with Python
FROM python:3.8-slim-buster

# Set the working directory in the container
WORKDIR /app

# Install curl and other dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Download and install Ollama
RUN curl -Lo ollama https://ollama.com/download/ollama-linux && \
    chmod +x ollama && \
    mv ollama /usr/local/bin/

# Pull the LLaMA model from Ollama
RUN ollama pull llama3.2:1b

# Copy your Flask app code into the container
COPY ./model.py /app/model.py

# Install required Python packages
RUN pip install Flask torch

# Expose port 5000 for the Flask app
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "model.py"]
