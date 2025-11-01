const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
  },
});

describe('Hello World Test', () => {
  it('should load the homepage', () => {
    cy.visit('/');
    cy.contains('Welcome to the Restaurant Booking App');
  });
});