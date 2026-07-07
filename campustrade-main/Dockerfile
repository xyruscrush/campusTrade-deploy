FROM node:22

WORKDIR /usr/src/app

# Copy package management files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY . .

# Expose the API port
EXPOSE 8000

# Run the backend server
CMD ["node", "index.js"]
