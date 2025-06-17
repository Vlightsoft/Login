FROM node:18-slim

# 1. Install system dependencies including build tools
RUN apt-get update && apt-get install -y \
  python3 python3-pip \
  libreoffice \
  fonts-dejavu \
  gcc g++ \
  libxml2-dev libxslt-dev libffi-dev pkg-config \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install python-docx and its dependencies
RUN pip3 install --no-cache-dir python-docx lxml

# 3. Set working directory
WORKDIR /app

# 4. Copy and install Node.js dependencies
COPY . .
RUN npm install

# 5. Expose port (if your app uses one)
EXPOSE 3000

# 6. Run pre-start scripts and launch
CMD node api-toggle-service/scripts/normalizeExistingToggles.js && \
    node api-toggle-service/seed/seedPlans.js && \
    node server.js
