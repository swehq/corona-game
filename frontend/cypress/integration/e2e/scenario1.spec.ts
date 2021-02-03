/// <reference types='cypress'/>

describe('Local Storage Saving Test', () => {
  it('Start Game', () => {

    cy.visit('/').then(() => {
      // TODO change language to czech if it's not and check that it's cs
    }); 

    cy.contains('Hrát').click().url().should('include', 'game');
    cy.contains('Hrát').click();

    cy.get('[ng-reflect-svg-icon=twoSpeed]').first().click();
  });

  it('Play the game', () => {
    // First play the game for a bit
    cy.contains('Zavřít hranice').click();
    cy.contains('Max. 1 000').click();
    cy.contains('Zavřít vysoké').click();

    // Click off the events until 1.4.
    cy.playUntilDate('1.4.2020').then(() => {
      cy.wait(500);
      cy.checkEventPresence();
      cy.checkEventPresence();
    });

    // Then check the local storage saving of the game
    let locallyStoredGame: any;

    cy.get('[ng-reflect-svg-icon=pause]').first().click().then(()=>{

      expect(localStorage.length).equal(1);
      locallyStoredGame = localStorage.getItem('lastGameData');

      cy.get('cvd-graphs').matchImageSnapshot('beforeGraph');

      cy.reload().then(() => {
        // TODO change language to czech if it's not and check that it's cs
      });

      cy.contains('Pokračovat v poslední hře').click().url().should('include', 'game');

      expect(localStorage.length).equal(1);
      expect(locallyStoredGame).equal(localStorage.getItem('lastGameData'));

      cy.wait(500);
      cy.get('cvd-graphs').matchImageSnapshot('beforeGraph');

      cy.exec('rm -r cypress/snapshots');
    });
  });
});