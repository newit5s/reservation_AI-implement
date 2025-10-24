describe('Frontend setup validation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders the home experience and supports navigation', () => {
    cy.contains('Restaurant Booking System').should('be.visible');
    cy.contains('Booking').click();
    cy.url().should('include', '/booking');
    cy.contains('Book a Table').should('be.visible');
  });

  it('switches languages across locales', () => {
    cy.contains('日本語').click();
    cy.contains('レストラン予約システム').should('be.visible');
    cy.contains('Tiếng Việt').click();
    cy.contains('Hệ Thống Đặt Bàn Nhà Hàng').should('be.visible');
  });

  it('adapts layout across responsive breakpoints', () => {
    const breakpoints = [
      { label: 'mobile', width: 375, height: 667 },
      { label: 'tablet', width: 768, height: 1024 },
      { label: 'desktop', width: 1280, height: 720 }
    ];

    breakpoints.forEach(({ width, height }) => {
      cy.viewport(width, height);
      cy.visit('/');
      cy.get('header').should('be.visible');
      cy.get('main').within(() => {
        cy.contains('Effortless reservations for modern restaurants').should('be.visible');
        cy.contains('Book a Table').should('exist');
      });
      cy.get('footer').should('be.visible');
    });
  });

  it('reads API configuration and attaches auth headers to requests', () => {
    cy.intercept('GET', 'http://localhost:5000/api/bookings/upcoming', (req) => {
      expect(req.url).to.eq('http://localhost:5000/api/bookings/upcoming');
      expect(req.headers['authorization']).to.eq('Bearer example-token');
      req.reply({
        statusCode: 200,
        body: {
          data: [
            {
              id: 'booking-1',
              bookingCode: 'ABC123',
              bookingDate: '2024-01-01',
              timeSlot: '18:00',
              partySize: 4,
              status: 'CONFIRMED'
            }
          ]
        }
      });
    }).as('fetchUpcoming');

    cy.visit('/admin', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'example-token');
      }
    });

    cy.wait('@fetchUpcoming');
    cy.contains('Upcoming Bookings').should('be.visible');
    cy.contains('ABC123').should('be.visible');
  });

  it('displays loading states while data is pending and clears them once resolved', () => {
    cy.intercept('GET', 'http://localhost:5000/api/bookings/upcoming', (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: { data: [] }
      });
    }).as('slowUpcoming');

    cy.visit('/admin', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'example-token');
      }
    });

    cy.get('.animate-spin').should('exist');
    cy.wait('@slowUpcoming');
    cy.get('.animate-spin').should('not.exist');
    cy.contains('No upcoming bookings.').should('be.visible');
  });

  it('shows the error boundary fallback when a component throws', () => {
    cy.visit('/test/crash', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        cy.stub(win.console, 'error');
      }
    });

    cy.contains('Something went wrong.').should('be.visible');
    cy.contains('Please refresh the page or contact support.').should('be.visible');
  });
});
