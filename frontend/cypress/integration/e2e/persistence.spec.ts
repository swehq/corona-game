import {GameService} from '../../../src/app/game/game.service';

function stopAtDate(dateToStop: string, waitTime: number, scenario: { [date: string]: string },
                    safeCounterLimit = 100, safeCounter = 0) {
  safeCounter++;

  return cy.get('[data-cy="game-date"]').then(dateElement => {
    const date = dateElement.text().replace('Dnes je ', '');

    if (date !== dateToStop) {
      const event = Cypress.$('[data-cy="event-continue"]');
      if (event.length) {
        event[0].click();
      }

      cy.wait(waitTime);

      if (scenario[date]) {
        cy.get('button').contains(scenario[date]).click();
      }

      if (safeCounter < safeCounterLimit) {
        stopAtDate(dateToStop, waitTime, scenario, safeCounterLimit, safeCounter);
      } else {
        throw new Error(`Safe counter limit reached! Limit is set to ${safeCounterLimit}, you can change as param of stopAtDate test function.`);
      }
    } else {
      cy.get('cvd-speed-control [ng-reflect-value="pause"]').first().click();
    }

    return cy.wrap(dateElement);
  });
}

describe('Local Storage Saving Test', () => {
  it('Test game persistence', () => {
    cy.visit('/')
      .get('cvd-language-picker [ng-reflect-value="cs"]').click();
    cy.get('[data-cy="start-game"]').click();
    cy.get('[data-cy="event-continue"]').last().click();

    cy.get('cvd-speed-control [ng-reflect-value="fast"]').click();

    const fastSpeed = new GameService(null).FAST_SPEED * 0.45;

    stopAtDate('1.4.2020', fastSpeed, {
      '15.3.2020': 'Zavřít rizikové',
      '10.3.2020': 'Zavřít vysoké',
      '25.3.2020': 'Zákaz vycházení',
    }).then(() => {
      cy.get('cvd-graphs').matchImageSnapshot('beforeGraph');
      cy.get('cvd-mitigations-control').matchImageSnapshot('beforeMitigationControl');

      cy.reload();

      cy.get('cvd-intro cvd-button')
        .contains('Pokračovat v poslední hře')
        .click()
        .url()
        .should('include', 'game');

      cy.get('[data-cy="game-date"]').contains('1.4.2020');

      cy.wait(500); // TO be sure all is loaded and rdy to take screenshot
      cy.get('cvd-graphs').matchImageSnapshot('beforeGraph');
      cy.get('cvd-mitigations-control').matchImageSnapshot('beforeMitigationControl');

      cy.exec('rm -r cypress/snapshots');
    });
  });
});
