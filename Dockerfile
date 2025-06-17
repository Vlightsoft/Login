FROM node:18

# Install system dependencies (includes Python, pip, LibreOffice, compiler dependencies)
RUN apt-get update && apt-get install -y \
  python3 python3-pip \
  libreoffice \
  fonts-dejavu \
  libc6-dev \
  gcc \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install python-docx for docx merging
RUN pip3 install --no-cache-dir python-docx

# Set working directory inside the container
WORKDIR /app

# Copy app files
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose port (if needed)
EXPOSE 3000

# Run initial setup and start server
CMD node api-toggle-service/scripts/normalizeExistingToggles.js && \
    node api-toggle-service/seed/seedPlans.js && \
    node server.js
