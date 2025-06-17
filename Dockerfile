FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
  python3 python3-pip \
  libreoffice \
  fonts-dejavu \
  gcc \
  g++ \
  libxml2-dev \
  libxslt-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install python-docx and its required deps
RUN pip3 install --no-cache-dir lxml python-docx

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install Node dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Run setup and start server
CMD node api-toggle-service/scripts/normalizeExistingToggles.js && \
    node api-toggle-service/seed/seedPlans.js && \
    node server.js
