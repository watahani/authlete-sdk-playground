# Use the Node.js image with TypeScript
FROM node:20

# Set the working directory inside the container
WORKDIR /workspace
# Copy package.json and package-lock.json (if exists) first for efficient caching
COPY package*.json ./

# Install dependencies, including TypeScript and ts-node
RUN npm install

# Install TypeScript globally (optional if not already installed in the dependencies)
RUN npm install -g typescript

# Copy the rest of the application source code
COPY . .

# Install Dependencies
RUN npm install

# Start the application
CMD ["npm", "start"]
