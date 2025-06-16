FROM node:18

# Install LibreOffice
RUN apt-get update && apt-get install -y libreoffice

# Set working directory inside the container
WORKDIR /app

# Copy everything from your project into the container
COPY . .

# Install Node dependencies
RUN npm install

# Expose the app port (optional for docs)
EXPOSE 3000
# Run setup scripts and start server
CMD node api-toggle-service/scripts/normalizeExistingToggles.js && \
    node api-toggle-service/seed/seedPlans.js && \
    node server.js
