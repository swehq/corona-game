declare namespace Cypress {
  interface Chainable {
    playEvents(num: number): Chainable<Response>;
    checkEventPresence(): Chainable<Response>;
    playUntilDate(date: string): Chainable<Response>;
    playUntilDate2(date: string): Chainable<Response>;
  }
}

Cypress.Commands.add('playEvents', (num) => {
  let i = 0;
  for (i; i<num; i++) {
    cy.get('[data-cy=event]', {timeout: 2000}).then(() => {
      cy.wait(500);
      cy.get('[data-cy=event-continue]', {timeout: 2000}).first().click();
    });
    cy.wait(500);
  }
})

Cypress.Commands.add('checkEventPresence', () => {
  cy.get('cvd-events-layout').then(($events) => {
    if ($events.children().length > 0) {
      cy.playEvents(1);
    }
  });
})

Cypress.Commands.add('playUntilDate2', (date) => {
  console.log('Method start');
  cy.get('cvd-status-display > cvd-row:first-child > div > div:first-child').then($node => {
      let observerDisconnected = false;
      const observer = new MutationObserver(callback);

      function callback(mutations: any[], observer: MutationObserver) {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' &&
           mutation.target.textContent === 'Dnes je ' + date) {
            observerDisconnected = true;
            observer.disconnect();
          } 
        }
      };
      observer.observe($node.get(0), {characterData: true, subtree:true});
      cy.get('[ng-reflect-svg-icon=pause]').first().click();
  });
})

Cypress.Commands.add('playUntilDate', (date) => {
  // Requires medium speed and then plays for a month
  var monthLoop = Array.from({length:35}, (v,k)=>k+1);

  cy.wrap(monthLoop).each(()=> {
    cy.wait(1000);
    cy.get('cvd-status-display > cvd-row:first-child > div > div:first-child').then($node => {
      cy.checkEventPresence();
      if ($node.get(0).innerHTML === 'Dnes je ' + date) {
        cy.get('[ng-reflect-svg-icon=pause]').first().click();
      }
    });
  });
})