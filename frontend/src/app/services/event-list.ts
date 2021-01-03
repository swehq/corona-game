import {DayState} from './simulation';
import {EventTrigger} from './events';
import {dateDiff} from './utils';
import {formatNumber} from '../utils/format';

function seasonalDateDiff(date: string, mmdd: string) {
  const date2 = date.slice(0, 5) + mmdd;
  return dateDiff(date, date2);
}

// no type check below for interpolated attributes
// TODO use rounded values
export const eventTriggers: EventTrigger[] = [
  /****************************************************************************
   *
   * Test events
   *
   ****************************************************************************/
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
        text: s => `Konkrétně ${formatNumber(s.stats.costs.total)} a to máme za sebou již ${formatNumber(s.stats.detectedInfections.total)} infikovaných`,
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

  /****************************************************************************
   *
   * State events
   *
   ****************************************************************************/

  // Krize a bonusy duvery
  {
    events: [
      {
        title: 'Důvěra ve vládu klesá',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= 25,
  },
  {
    events: [
      {
        title: 'Češi jsou z koronaviru frustrovaní',
        text: 'Nálada je stále horší, tvrdí terapeut.',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= 0,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá k rezignaci!',
        help: 'Společenská stabilita dosahuje kritických čísel. Pokud dosáhne hodnoty -50, Vaše hra končí.',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= -30,
    timeout: 30, // repeat every 30 days
  },

  // pocet mrtvych za den
  {
    events: [
      { // Random event title demo
        title: 'Za pouhý den COVID zabil {{stats.deaths.today}} lidí',
      },
      {
        title: '{{stats.deaths.today}} mrtvých za jediný den',
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
        title: 'Česko má rekordní denní počet úmrtí lidí nakažených covidem',
        help: 'Zvyšující se počet obětí se negativně propisuje do hodnoty společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: -2, timeout: 1}],  // Important to set timeout: 1 for one time events
      },
    ],
    condition: (s: DayState) => s.stats.deaths.today >= 10,
  },

  /****************************************************************************
   *
   * Seasonal events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Začátek prázdnin',
        text: 'Školáci dnes dostávají vysvědčení a začínají jim prázdniny.',
        help: 'Opatření “uzavření škol” bylo aktivováno bez dalších nákladů.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '06-31') === 0,
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Konec prázdnin',
        text: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět vyžaduje další náklady a snižuje společenskou stabilitu.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '09-01') === 0,
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Virus se v teplém podnebí hůř šíří. Vědci předpokládají zpomalení pandemie.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '05-19') * 0.04 > Math.random(),
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Konec teplého počasí',
        text: 'Jak teplota ovlivňuje šíření koronaviru? Chladné počasí počasí pomáhá šíření, tvrdí epidemiologové.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '09-09') * 0.04 > Math.random(),
    timeout: 90, // Happens every year
  },

];
