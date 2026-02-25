# lab-inventory/Dockerfile
FROM node:20-bookworm-slim



WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only package files first for better caching
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY shared/package.json shared/package.json

# Install all workspace deps from the root
RUN npm ci

# Now copy the rest of the repo
COPY . .

# (Optional but recommended) generate prisma client for linux container
# If you use Prisma in server, this avoids platform mismatch issues
WORKDIR /app/server
RUN npx prisma generate 

WORKDIR /app