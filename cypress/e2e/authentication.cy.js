// cypress/e2e/authentication.cy.js
describe('Authentication', () => {
  it('should allow user to sign up', () => {
    cy.visit('/sign-up.html');
    cy.get('#signup-email').type(`test-${Date.now()}@example.com`);
    cy.get('#signup-password').type('Test123!');
    cy.get('#signup-form button').click();
    // Add assertions for successful signup
  });
});

// cypress/e2e/itinerary.cy.js
describe('Itinerary Creation', () => {
  // Your itinerary tests here
});