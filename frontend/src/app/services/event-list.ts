import {EventInput, EventTrigger} from './events';
import {dateDiff} from './utils';
import {isNil, random} from 'lodash';

// Event mitigation IDs
const PANIC_ID = 'panic';
const VACCINATION_CAMPAIGN_ID = 'vaccinationCampaign';

// Event trigger IDs
const ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER = 'antivaxWithoutCampaignTrigger';
const ANTIVAX_WITH_CAMPAIGN_TRIGGER = 'antivaxWithCampaignTrigger';

/**
 * Generate first true randomly between given dates
 * TODO: unit test
 * @param date - simulation date
 * @param dateFrom - interval start (YYYY-MM-DD)
 * @param dateTo - interval end (YYYY-MM-DD)
 */
function dateBetweenTrigger(date: string, dateFrom: string, dateTo: string) {
  if (dateDiff(date, dateFrom) < 0) {
    // before given interval
    return false;
  } else if (dateDiff(date, dateTo) <= 0) {
    // in between interval
    return (1 / (1 - dateDiff(date, dateTo))) > Math.random();
  } else {
    // after given interval
    return false;
  }
}

/**
 * Return true with given probability
 * @param probabilityRate - probability between 0..1 (e.g 0.05 means probability 5%)
 */
function probability(probabilityRate: number){
  return probabilityRate > Math.random();
}

/**
 * Returns true if EventMitigation is active
 * @param eventInput - EventInput
 * @param id - Id of the EventMitigation
 */
function isEventMitigationActive(eventInput: EventInput, id: string) {
  const mitigation = eventInput.eventMitigations.find(em => em.id === id);
  return !isNil(mitigation);
}

/**
 * Returns true if EventTrigger is active
 * @param eventInput - EventInput
 * @param id - Id of the EventTrigger
 */
function isEventTriggerActive(eventInput: EventInput, id: string) {
  const triggerState = eventInput.triggerStates.find(ts => ts.trigger.id === id);
  return !isNil(triggerState) && triggerState.timeout <= 0;
}

export interface EventData {
  tooManyDeathsDays: number;
  showAntivaxEvent: boolean;
}

export const initialEventData: EventData = {
  tooManyDeathsDays: 0,
  showAntivaxEvent: false,
};

/**
 * Callback that is called every day before trigger conditions are evaluated
 * @param eventInput - EventInput
 */
export function updateEventData(eventInput: EventInput) {
  const eventData = eventInput.eventData;

  if (eventInput.stats.deaths.avg7Day >= (2500 / 7)) {
    eventData.tooManyDeathsDays++;
  } else {
    eventData.tooManyDeathsDays = 0;
  }

  eventData.showAntivaxEvent = eventInput.date > '2021-01-10'
    && isEventTriggerActive(eventInput, ANTIVAX_WITH_CAMPAIGN_TRIGGER)
    && isEventTriggerActive(eventInput, ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER)
    && probability(0.02);
}

const antivaxEvents = [
  {
    title: 'Toto jsou fakta: vakcína proti koronaviru je tvořena fragmenty tkání z potracených lidských plodů!',
    text: 'Ve společnosti se šíří hoax o tom, že vakcína obsahuje látky z nenarozených dětí.',
    help: 'Rychlost vakcinace se snižuje.',
    mitigations: [
      {label: 'OK', vaccinationPerDay: -0.0002, timeout: Infinity},
    ],
  },
];

const antivaxEventsWithCampaign = antivaxEvents.map(e => ({
  ...e,
  help: 'Očkovací kampaň přestala fungovat.',
  mitigations: [
    {label: 'OK', id: VACCINATION_CAMPAIGN_ID, timeout: 0},
  ],
}));


// no type check below for interpolated attributes
// TODO use rounded values
export const eventTriggers: EventTrigger[] = [
  /****************************************************************************
   *
   * Tutorial events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Hra začíná',
        text: s => `Nacházíte se v prvním dni hry, je ${new Date(s.date).toLocaleDateString()}, první nakažení SARS-CoV-19 se blíží.`,
        help: 'Stiskněte OK a hra začne',
        // TODO just a demonstration
        mitigations: [
          // use optional .name to display event mitigation in the list
          {label: 'A (-1 bil.)', name: 'Ad hoc opatření A', timeout: 0, compensationCost: -1_000_000_000_000},
          {label: 'B (-2 bil.)', name: 'Ad hoc opatření B', timeout: 1, compensationCost: -2_000_000_000_000},
          {label: 'C (nic)', name: 'Ad hoc opatření C', timeout: 60},
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-03-01',
  },
  /****************************************************************************
   *
   * Economic events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Analytici varují před rychlostí zadlužování země',
        text: 'Náklady na zvládnutí koronavirové krize již dosáhly sta miliard.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 100_000_000_000,
  },
  {
    events: [
      {
        title: 'Výše státního dluhu je hrozivá, říkají analytici',
        text: 'Náklady na zvládnutí koronavirové krize již dosáhly pěti set miliard korun.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 500_000_000_000,
  },
  {
    events: [
      {
        title: 'Státní dluh je nejvyšší v historii a dramaticky roste každou vteřinu!',
        text: 'Náklady na zvládnutí koronavirové krize dosáhly bilionu korun.',
        mitigations: [{label: 'OK', timeout: 1, stabilityCost: 6}],
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 1_000_000_000_000,
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
    condition: (ei: EventInput) => ei.stats.stability <= 25,
  },
  {
    events: [
      {
        title: 'Češi jsou z koronaviru frustrovaní',
        text: 'Nálada je stále horší, tvrdí terapeut.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 0,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá k rezignaci!',
        help: 'Společenská stabilita dosahuje kritických čísel. Pokud dosáhne hodnoty -50, Vaše hra končí.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= -30,
    timeout: 30, // repeat every 30 days
  },
  /****************************************************************************
   *
   * Death events
   *
   ****************************************************************************/
  // pocet mrtvych za den: 10+
  {
    events: [
      {
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
    condition: (ei: EventInput) => ei.stats.deaths.today >= 10,
  },
  // pocet mrtvych za den: 100+
  {
    events: [
      {
        title: 'Česko má rekordní denní počet úmrtí lidí nakažených covidem',
        help: 'Zvyšující se počet obětí negativně ovlivňuje hodnotu společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 2, timeout: 1}],  // Important to set timeout: 1 for one time events
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 100,
  },
  // pocet mrtvych za den: 500+
  {
    events: [
      {
        title: 'Česko zvládá pandemii nejhůř na světě, krematoria ukládají mrtvé do mrazících vozů',
        help: 'Zvyšující se počet obětí negativně ovlivňuje hodnotu společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 6, timeout: 1}],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 500,
  },
  // pocet mrtvych za den: 1000+
  {
    events: [
      {
        title: 'Temné predikce se naplnily: Česko přesáhlo hranici 1000 mrtvých na koronavirus za den. Policie sváží mrtvé, armáda kope masové hroby',
        help: 'Zvyšující se počet obětí negativně ovlivňuje hodnotu společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 30, timeout: 1}],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 1000,
  },
  // pocet mrtvych celkem: 10000+
  {
    events: [
      {
        title: 'Koronavirus v Česku usmrtil už přes 10 000 lidí.',
        help: 'Zvyšující se počet obětí negativně ovlivňuje hodnotu společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 5, timeout: 1}],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.total >= 10000,
  },
  // pocet mrtvych celkem: 100000+
  {
    events: [
      {
        title: 'Další tragický milník: Česko překonalo hranici 100 000 zemřelých na covid',
        help: 'Zvyšující se počet obětí negativně ovlivňuje hodnotu společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 10, timeout: 1}],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.total >= 100000,
  },
  // Panika
  {
    events: [
      {
        title: 'Za poslední týden si koronavirus vyžádal tisíce obětí a počet mrtvých stále rapidně vzrůstá.',
        text: 'Kritická situace vede obyvatele k větší izolaci tam, kde je to možné.',
        help: 'Izolace obyvatel zvyšuje náklady. Na druhou stranu výrazně snižuje hodnotu R.',
        // cost = 1.5*cost of lockdown (values taken from game.ts)
        // rMult is applied everyDay!
        mitigations: [{
          label: 'OK', id: PANIC_ID, rMult: 0.985, economicCost: (0.32 + 0.06 + 0.35) * 1.5 * 1_000_000_000,
          timeout: Infinity,
          stabilityCost: (0.15 + 0.05 + 0.15) * 1.5,
        }],
      },
    ],
    condition: (ei: EventInput) =>
      (!isEventMitigationActive(ei, PANIC_ID) && probability(ei.eventData.tooManyDeathsDays * 0.05)),
    timeout: 1,
  },
  {
    events: [
      {
        title: 'Život v zemi se vrací do normálu.',
        help: 'Izolace obyvatel skončila.',
        // end panic
        // TODO timeout=0 (formerly undefined) effectively disables the mitigation
        // needs to be reworked or documented
        mitigations: [{label: 'OK', id: PANIC_ID, timeout: 0}],
      },
    ],
    condition: (ei: EventInput) => (isEventMitigationActive(ei, PANIC_ID) && ei.stats.deaths.avg7Day <= 500),
    timeout: 1,
  },
  // malo mrtvych / demostrance
  {
    events: [
      {
        title: 'V centru Prahy dnes demonstrovali odpůrci koronavirových opatření. Neměli roušky, nedodržovali rozestupy',
        help: 'Zatknutí odpůrců může pobouřit část obyvatel a snížit tak společenskou stabilitu. Pokud však protesty proběhnou bez zásahu, přibude velké množství nakažených.',
        mitigations: [
          {label: 'Nechat protesty proběhnout', exposedDrift: random(1000, 2000), timeout: 1},
          {label: 'Pozatýkat', stabilityCost: 2, timeout: 1},
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= -10 && ei.stats.deaths.avg7Day < (500 / 7),
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
    condition: (ei: EventInput) => ei.date === '2020-06-31',
  },
  {
    events: [
      {
        title: 'Konec prázdnin',
        text: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět vyžaduje další náklady a snižuje společenskou stabilitu.',
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-09-01',
  },
  {
    events: [
      {
        title: 'Virus se v teplém podnebí hůř šíří. Vědci předpokládají zpomalení pandemie.',
      },
    ],
    condition: (ei: EventInput) => dateBetweenTrigger(ei.date, '2020-05-20', '2020-06-14'),
  },
  {
    events: [
      {
        title: 'Konec teplého počasí',
        text: 'Jak teplota ovlivňuje šíření koronaviru? Chladné počasí počasí pomáhá šíření, tvrdí epidemiologové.',
      },
    ],
    condition: (ei: EventInput) => dateBetweenTrigger(ei.date, '2020-09-10', '2020-10-09'),
  },
  /****************************************************************************
   *
   * Autumn package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Skandál ministra',
        text: 'Ministr porušil svá vlastní pravidla. V jeho vile se na večírku sešlo přes dvacet osob!',
        help: 'Pokud ministr po porušení vlastních nařízení setrvá na místě, mohou se obyvatelé bouřit, což znamená pokles společenské stability. Vyhození ministra, který je ve své práci již zaběhlý, může výrazně posunout začátek očkování.',
        mitigations: [
          // todo: fire -> postpone vaxination start
          {label: 'Vyhodit ministra', vaccinationPerDay: -0.0001, timeout: Infinity},
          {label: 'Neřešit prohřešek', stabilityCost: 5, timeout: 1},
        ],
      },
      {
        title: 'Odhalili jsme: předražené zakázky za miliardy!',
        text: 'Jeden z našich dodavatelů trasování si účtuje mnohem víc peněz než je v branži zvykem, ale zároveň jsme na jeho dodávkách závislí.',
        help: 'Pokud budeme nadále setrvávat s dosavadním dodavatelem, ztratíme na nevýhodných zakázkách více peněz. Bez těchto dodávek se ale zvýší hodnota R.',
        mitigations: [
          {label: 'Zůstat s dodavatelem', economicCost: 5_000_000_000, timeout: 1},
          {label: 'Změnit dodavatele', rMult: 1.05, timeout: 1},
        ],
      },
      {
        title: 'Nejsem ovce, nošení roušky odmítám! Přežijí silnější.',
        text: 'Významný politik veřejně odsuzuje nošení roušek a byl bez ní několikrát vyfocen v obchodě',
        help: 'Pokud významná politická osobnost nebude potrestána může to vést k menší disciplíně obyvatelstva při dodržování opatření, což může přinést, jak nové nakažené, tak negativně ovlivnit hodnotu R. Jeho potrestání však může pobouřit jeho příznivce a negativně tak ovlivnit společenskou stabilitu.',
        mitigations: [
          {label: 'Neřešit prohřešek', rMult: 1.02, exposedDrift: random(1000, 2000), timeout: 1},
          {label: 'Potrestat politika jako ostatní', stabilityCost: 2, timeout: 1},
        ],
      },
      {
        title: 'Zažije Česko první volby ve znamení koronaviru?',
        help: 'Odložení voleb obyvatelstvo popudí a negativně se odrazí ve společenské stabilitě. Pokud volby proběhnou, přibude nakažených.',
        mitigations: [
          {label: 'Odložit volby', stabilityCost: random(4, 8, true), timeout: 1},
          {label: 'Nechat volby proběhnout', exposedDrift: random(2000, 5000), timeout: 1},
        ],
      },
    ],
    condition: (ei: EventInput) => dateBetweenTrigger(ei.date, '2020-10-15', '2020-12-01'),
  },
  /****************************************************************************
   *
   * Winter package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Vláda se zabývá otevřením skiaeálů. Situace komplikuje rozhodnutí.',
        help: 'Otevření skiareálů zvýší počet nakažených v řádu tisíců. Jejich zavření na druhou stranu negativně ovlivní společenskou stabilitu.',
        mitigations: [
          {label: 'Otevřít skiareály', exposedDrift: random(2000, 5000), timeout: 1},
          {label: 'Neotevřít', stabilityCost: 5, timeout: 1},
        ],
      },
      // Vánoční svátky
      {
        title: 'Vánoce během koronaviru: Jaké svátky nás letos čekají?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Lze očekávat, že udělení výjimek pro období svátků obyvatelé ocení a pozitivně se tak promítne do společenské stability, ale zato přinese větší počet nových nakažených. Přísná opatření se zase naopak setkají s nevolí obyvatel a poklesem společenské stability.',
        mitigations: [
          {label: 'Povolit půlnoční mše', stabilityCost: -2,
            exposedDrift: random(500, 1500), timeout: 1},
          {label: 'Udělit výjimku pro rodinná setkání nad 6 lidí', stabilityCost: -2,
            exposedDrift: random(1000, 2000), timeout: 1},
          {label: 'Povolit obojí', stabilityCost: -5, exposedDrift: random(1500, 4000), timeout: 1},
          {label: 'Zakázat půlnoční mše i rodinná setkání nad 6 lidí', stabilityCost: 5, timeout: 1},
        ],
      },
      // Silvestr
      {
        title: 'Jak česko oslaví příchod nového roku v době pandemie covid-19?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Pokud budou opatření zpřísněna, lze očekávat vlnu nevole obyvatel a snížení společenské stability. Výjimky z opatření sice společenskou stabilitu lehce zvýší, ale povedou ke zvýšení počtu nemocných.',
        mitigations: [
          {label: 'Povolit večerní vycházení na Silvestra', stabilityCost: -2,
            exposedDrift: random(10000, 20000), timeout: 1},
          {label: 'Nepovolovat večerní vycházení na Silvestra', stabilityCost: 5, timeout: 1},
        ],
      },
    ],
    condition: (ei: EventInput) => dateBetweenTrigger(ei.date, '2020-12-02', '2020-12-20'),
  },
  /****************************************************************************
   *
   * Vaccination events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Testování vakcín v poslední fázi.',
        text: 'Stát skrze společný nákup Evropské unie objednal miliony očkovacích dávek.',
        help: 'Úspěšný vývoj vakcín a jejich výhodný nákup zvyšuje společenskou stabilitu.',
        mitigations: [{label: 'OK', stabilityCost: -10, timeout: 1}], // One time event
      },
    ],
    condition: (ei: EventInput) => dateBetweenTrigger(ei.date, '2020-10-25', '2020-11-25'),
  },
  {
    events: [
      {
        title: 'Zmírní kampaň obavy z očkování proti covidu-19?',
        text: 'Je třeba se rozhodnout, zda budou investovány peníze do propagace očkování proti koronaviru.',
        help: 'Investice do kampaně pro očkování zvýší zájem o vakcinaci a tím pádem její rychlost. Je na ni však třeba vydat další náklady a zároveň se při možném neúspěchu kampaně  negativně ovlivní společenskou stabilitu. Odmítnutí proma vakcinaci zpomalí.',
        mitigations: [
          {
            label: 'Investovat do propagace vakcín', id: VACCINATION_CAMPAIGN_ID, vaccinationPerDay: 0.0001,
            timeout: Infinity,
            oneTimeEffect: {economicCost: 1_000_000_000},
          },
          {label: 'Neinvestovat', vaccinationPerDay: -0.0001, timeout: Infinity},
        ],
      },
    ],
    // TODO timing randomization
    condition: (ei: EventInput) => ei.date >= '2021-01-01',
    timeout: 90,
  },
  {
    events: antivaxEvents,
    id: ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER,
    condition: (ei: EventInput) =>
      (ei.eventData.showAntivaxEvent && !isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID)),
    timeout: 7, // cannot occur more often than once every 7 days
  },
  {
    events: antivaxEventsWithCampaign,
    id: ANTIVAX_WITH_CAMPAIGN_TRIGGER,
    condition: (ei: EventInput) =>
      (ei.eventData.showAntivaxEvent && isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID)),
    timeout: 7, // cannot occur more often than once every 7 days
  },
  {
    events: [
      {
        title: 'Tři sousední země překročily hranici 75 % proočkování populace.',
        text: 'Sousední země mají proočkováno a nabízejí pomoc s očkováním v ČR.',
        help: 'Přijetí zahraniční pomoci urychlí vakcinaci a zvedne o několik procent proočkovanost ČR. Její odmítnutí se může negativně ovlivnit společenskou stabilitu.',
        mitigations: [
          // total impact 5% vaccinated over 25 days
          {label: 'Přijmout zahraniční pomoc', vaccinationPerDay: 0.002, timeout: 25},
          {label: 'Nepřijmout zahraniční pomoc', stabilityCost: 5, timeout: 1},
        ],
      },
    ],
    condition: (ei: EventInput) => (dateBetweenTrigger(ei.date, '2021-06-15', '2021-06-30')
      && ei.stats.vaccinationRate < .75),
  },
  {
    events: [
      {
        title: 'Úspěšně očkujeme',
        text: 'Polovina populace již byla očkována.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.vaccinationRate > .5,
  },
];
