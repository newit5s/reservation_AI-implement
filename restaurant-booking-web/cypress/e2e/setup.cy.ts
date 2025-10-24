describe('Frontend setup smoke test', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the home page', () => {
    cy.contains('Restaurant Booking System').should('be.visible');
  });

  it('navigates between pages', () => {
    cy.contains('Booking').click();
    cy.url().should('include', '/booking');
    cy.contains('Book a Table').should('be.visible');
  });

  it('switches languages', () => {
    cy.contains('日本語').click();
    cy.contains('レストラン予約システム').should('be.visible');
    cy.contains('Tiếng Việt').click();
    cy.contains('Hệ Thống Đặt Bàn Nhà Hàng').should('be.visible');
  });
});
