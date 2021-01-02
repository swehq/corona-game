import {DayState} from './simulation';
import {EventTrigger} from './events';

// no type check below for interpolated attributes
// TODO use rounded values
export const eventTriggers: EventTrigger[] = [
  // test events
  {
    events: [
      {
        title: '{{stats.deaths.today}} mrtvých za jediný den',
        text: 'Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...',
      },
      {
        title: 'Šok: {{stats.deaths.today}} mrtvých za jediný den',
        text: 'Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.',
      },
    ],
    condition: (s: DayState) => s.stats.deaths.today >= 10,
  },
  {
    events: [
      {
        title: 'První mrtvý',
        text: 'Co se vláda rozhodne udělat?',
        mitigations: [{label: 'Nic', timeout: 0}, {label: 'Letáková kampaň', timeout: 14, rMult: 0.9, cost: 0.001}],
      },
    ],
    condition: (s: DayState) => s.stats.deaths.today >= 1,
  },
   {
    events: [
      {
        title: 'Ekonomika: První miliarda v nákladech!',
        // TODO show in billion
        text: 'Konkrétně {{stats.costs.total}} a to máme za sebou již {{stats.detectedInfections.total}} infikovaných',
      },
    ],
    condition: (s: DayState) => s.stats.costs.total > 1_000_000_000,
  },
  {
    events: [
      {
        title: 'Úspěšně očkujeme',
        text: 'Polovina populace již byla očkována.',
      },
    ],
    condition: (s: DayState) => s.stats.vaccinationRate > .5,
  },

  // Events from game design document
];
