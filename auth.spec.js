// cypress/integration/auth.spec.js
describe('Authentication Flow', () => {
  it('Should allow signing up', () => {
    cy.visit('/sign-up.html');
    cy.get('#signup-email').type(`test-${Date.now()}@example.com`);
    cy.get('#signup-password').type('Test123!');
    cy.get('#signup-form button').click();
    cy.url().should('include', 'index.html');
  });
  
  it('Should allow logging in', () => {
    // Use a test account that already exists
    cy.visit('/sign-up.html');
    cy.get('#login-tab').click();
    cy.get('#login-email').type('your-test-account@example.com');
    cy.get('#login-password').type('your-test-password');
    cy.get('#login-form button').click();
    cy.url().should('include', 'index.html');
    
    // Check if navbar shows logged in state
    cy.get('#auth-button').should('contain', 'My Account');
  });
});

// cypress/integration/itinerary.spec.js
describe('Itinerary Generation Flow', () => {
  beforeEach(() => {
    // Log in first
    cy.visit('/sign-up.html');
    cy.get('#login-tab').click();
    cy.get('#login-email').type('your-test-account@example.com');
    cy.get('#login-password').type('your-test-password');
    cy.get('#login-form button').click();
  });
  
  it('Should generate an itinerary', () => {
    cy.visit('/index.html');
    cy.get('#user-input').type('3-day trek in the Alps');
    cy.get('#itinerary-form button').click();
    
    // Should redirect to customize page
    cy.url().should('include', 'customize.html');
    
    // Fill out the customization form
    cy.get('[data-category="difficulty"][data-value="Moderate"]').click();
    cy.get('[data-category="accommodation"][data-value="Hut-to-Hut"]').click();
    cy.get('#comments').type('I want scenic views and not too challenging terrain');
    cy.get('#customization-form button[type="submit"]').click();
    
    // Wait for itinerary to generate (this may take some time)
    cy.get('#itinerary-cards', { timeout: 30000 }).should('be.visible');
    cy.get('#itinerary-cards').should('contain', 'Day 1:');
    
    // Test saving
    cy.get('#save-itinerary').click();
    cy.get('.notification').should('contain', 'Itinerary saved successfully');
  });
  
  it('Should display saved itineraries', () => {
    cy.visit('/my-itineraries.html');
    cy.get('#itineraries-container .bg-white').should('have.length.at.least', 1);
  });
});

// cypress/integration/subscription.spec.js
describe('Subscription Flow', () => {
  beforeEach(() => {
    // Log in first with test account
    cy.visit('/sign-up.html');
    cy.get('#login-tab').click();
    cy.get('#login-email').type('your-test-account@example.com');
    cy.get('#login-password').type('your-test-password');
    cy.get('#login-form button').click();
  });
  
  it('Should display subscription plans', () => {
    // Navigate to subscription page (this will depend on your UI)
    cy.visit('/subscription/plans');
    cy.get('.plan-card').should('have.length.at.least', 2);
    cy.get('.plan-card.premium-plan').should('contain', 'Professional');
  });
  
  // For actual payment testing, you'd use Stripe test mode
  // This would typically redirect to Stripe Checkout
  // You can test the redirect but not complete the payment in automated tests
});