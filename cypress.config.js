const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001', // Change to match your development server
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});