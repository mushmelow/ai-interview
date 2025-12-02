# Stage 1: The "base" stage with dependencies
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/cv-parser-backend/app

WORKDIR /cv-parser-backend

# Install system dependencies needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# This is done here so both dev and prod stages have the code
COPY . .


# Stage 2: The "development" stage
FROM base AS development

# Expose ports for the app and the debugger
EXPOSE 8000 5678

RUN apt-get update && apt-get install -y \
    net-tools \
    lsof \
    iputils-ping \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# ENTRYPOINT defines the main debugger command
ENTRYPOINT ["bash", "-c", "python -m debugpy --listen 0.0.0.0:5678 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

# Stage 3: The "production" stage
FROM base AS production

# ENTRYPOINT is the production server executable
ENTRYPOINT ["gunicorn"]

# CMD provides the configuration for the production server
CMD ["-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
