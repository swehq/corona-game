import {EventInput, EventMitigation, EventTrigger} from './events';
import {dateDiff} from './utils';
import {isNil, random} from 'lodash';

// Event mitigation IDs
const SELF_ISOLATION_ID = 'selfIsolation';
const SCHOOL_HOLIDAYS_ID = 'schoolHolidays';
const WARM_WEATHER_ID = 'warmWeather';
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
function randomDateBetweenTrigger(date: string, dateFrom: string, dateTo: string) {
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

function dateBetween(date: string, dateFrom: string, dateTo: string) {
  return date >= dateFrom && date <= dateTo;
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

  // Stability events
  stability: number;
  lastStability: number;
  stabilityThreshold: number;
  lastStabilityThreshold: number;
}

export const initialEventData: EventData = {
  tooManyDeathsDays: 0,
  showAntivaxEvent: false,
  stability: 50,
  lastStability: 50,
  stabilityThreshold: 50,
  lastStabilityThreshold: 50,
};

/**
 * Callback that is called every day before trigger conditions are evaluated
 * @param eventInput - EventInput
 */
export function updateEventData(eventInput: EventInput) {
  const eventData = eventInput.eventData;

  // Panic tracking
  if (eventInput.stats.deaths.avg7Day >= (2500 / 7)) {
    eventData.tooManyDeathsDays++;
  } else {
    eventData.tooManyDeathsDays = 0;
  }

  // Antivax
  eventData.showAntivaxEvent = eventInput.date > '2021-01-10'
    // Both triggers need to be active in order not emit their events too soon one after another
    && isEventTriggerActive(eventInput, ANTIVAX_WITH_CAMPAIGN_TRIGGER)
    && isEventTriggerActive(eventInput, ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER)
    && probability(0.02);

  // Stability thresholds
  eventData.lastStability = eventData.stability;
  eventData.stability = eventInput.stats.stability;
  eventData.lastStabilityThreshold = eventData.stabilityThreshold;
  [-45, -30, 0, 25, 50].forEach(t => {
    if (eventData.stability <= t && t <= eventData.lastStability
      || eventData.lastStability <= t && t <= eventData.stability) {
      eventData.stabilityThreshold = t;
    }
  });
}

function simpleChoice(label: string, mitigation?: Partial<EventMitigation>) {
  const mitigations = (mitigation !== undefined) ? [mitigation] : undefined;
  return {label, mitigations};
}

function okButton(mitigation?: Partial<EventMitigation>) {
  return [simpleChoice('Ok', mitigation)];
}

function okButtonEndMitigation(id: string) {
  return [{label: 'Ok', removeMitigationIds: [id]}];
}

const antivaxEventTexts = [
  {
    title: 'Vakcína neprošla dostatečným testováním, tvrdí odborník',
    text: 'Lidé mají strach, že nová vakcína proti koronaviru je nedostatečně testovaná a očkování proto odmítají',
  },
  {
    title: 'Čeští odpůrci sepsali petici proti očkování',
    text: 'Mezi obyvateli se šíří obava z očkování proti koronaviru',
  },
  {
    title: 'Strachem proti očkování, odpůrci spustili online kampaň',
    text: 'Odpůrci začali koordinovaně rozesílat zprávy, které mají nalomit důvěru lidí v očkování proti Covidu-19',
  },
  {
    title: 'Češi popisují první pociťované vedlejší vedlejší účinky vakcíny proti covidu',
    text: 'Lidé mají strach z vedlejších účinků očkování a vakcínu proto odmítají',
  },
  {
    title: 'Vakcínu píchli premiérovi jen naoko',
    text: 'Sociálními sítěmi se šíří nový hoax o tom, že premiér byl fingovaně očkován jehlou s krytem',
  },
];

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
        title: 'V České republice je první případ nákazy koronavirem',
        text: 'První případ nákazy Covidem-19 byl dnes potvrzen i v Česku. Na vás teď je, abyste na situaci zareagovali zavedením libovolných opatření. Barva jsou aktivní opatření, barva naopak značí, že opatření aktuálně není zavedeno. Každé opatření se projevuje na šíření koronaviru rozdílně. Více informací zjistíte v infoboxech jednotlivých opatření. Pamatujte, že nějaká čas trvá, než se opatření na množství nakažených projeví.',
        choices: [simpleChoice('Začít hrát')],
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
        choices: okButton({stabilityCost: 6}),
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
    condition: (ei: EventInput) => ei.eventData.stabilityThreshold === 25
      && ei.eventData.stabilityThreshold < ei.eventData.lastStabilityThreshold,
    timeout: 1,
  },
  {
    events: [
      {
        title: 'Češi jsou z koronaviru frustrovaní',
        text: 'Nálada je stále horší, tvrdí terapeut.',
      },
    ],
    condition: (ei: EventInput) => ei.eventData.stabilityThreshold === 0
      && ei.eventData.stabilityThreshold < ei.eventData.lastStabilityThreshold,
    timeout: 1,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá k rezignaci!',
        help: 'Společenská stabilita dosahuje kritických čísel. Pokud dosáhne hodnoty -50, Vaše hra končí.',
        choices: okButton({name: 'Výzvy k rezignaci', duration: 60}),
      },
    ],
    condition: (ei: EventInput) => ei.eventData.stabilityThreshold === -30
      && ei.eventData.stabilityThreshold < ei.eventData.lastStabilityThreshold,
    timeout: 1,
  },
  {
    events: [
      {
        title: 'Důvěra ve vládu opět stoupá',
      },
    ],
    condition: (ei: EventInput) => ei.eventData.stabilityThreshold > ei.eventData.lastStabilityThreshold,
    timeout: 1,
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
        choices: okButton({stabilityCost: 2}),
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
        choices: okButton({stabilityCost: 6}),
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
        choices: okButton({stabilityCost: 30}),
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
        choices: okButton({stabilityCost: 5}),
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
        choices: okButton({stabilityCost: 10}),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.total >= 100_000,
  },
  // malo mrtvych / demostrance
  {
    events: [
      {
        title: 'V centru Prahy dnes demonstrovali odpůrci koronavirových opatření. Neměli roušky, nedodržovali rozestupy',
        help: 'Zatknutí odpůrců může pobouřit část obyvatel a snížit tak společenskou stabilitu. Pokud však protesty proběhnou bez zásahu, přibude velké množství nakažených.',
        choices: [
          simpleChoice('Nechat protesty proběhnout', {exposedDrift: random(1000, 2000)}),
          simpleChoice('Pozatýkat', {stabilityCost: 2}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= -10 && ei.stats.deaths.avg7Day < (500 / 7),
  },
  // Self isolation
  {
    events: [
      {
        title: 'Za poslední týden si koronavirus vyžádal tisíce obětí a počet mrtvých stále rapidně vzrůstá.',
        text: 'Kritická situace vede obyvatele k větší izolaci tam, kde je to možné.',
        help: 'Izolace obyvatel zvyšuje náklady. Na druhou stranu výrazně snižuje hodnotu R.',
        // cost = 1.5*cost of lockdown (values taken from game.ts)
        // TODO get values from game.ts
        // rMult is applied everyDay!
        choices: okButton({
          id: SELF_ISOLATION_ID, rMult: 0.7, economicCost: (0.05 + 0.32 + 0.06 + 0.35) * 1.5 * 1_000_000_000,
          duration: Infinity,
          stabilityCost: (0.2 + 0.15 + 0.05 + 0.15) * 1.5,
          name: 'Dobrovolná izolace',
        }),
      },
    ],
    condition: (ei: EventInput) =>
      (!isEventMitigationActive(ei, SELF_ISOLATION_ID) && probability(ei.eventData.tooManyDeathsDays * 0.05)),
    timeout: 1,
  },
  {
    events: [
      {
        title: 'Život v zemi se vrací do normálu.',
        help: 'Izolace obyvatel skončila.',
        // End isolation
        choices: okButtonEndMitigation(SELF_ISOLATION_ID),
      },
    ],
    condition: (ei: EventInput) => (isEventMitigationActive(ei, SELF_ISOLATION_ID) && ei.stats.deaths.avg7Day <= 500),
    timeout: 1,
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
        text: 'Školáci dostávají vysvědčení a začínají jim prázdniny.',
        help: 'Opatření “uzavření škol” bylo aktivováno bez dalších nákladů.',
        choices: okButton({name: 'Prázdniny', id: SCHOOL_HOLIDAYS_ID, duration: 62}),
      },
    ],
    condition: (ei: EventInput) => dateBetween(ei.date, '2020-06-30', '2020-07-31'),
    timeout: 60,
  },
  {
    events: [
      {
        title: 'Konec prázdnin',
        text: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět vyžaduje další náklady a snižuje společenskou stabilitu.',
        choices: okButtonEndMitigation(SCHOOL_HOLIDAYS_ID),
      },
    ],
    condition: (ei: EventInput) => dateBetween(ei.date, '2020-09-01', '2020-09-30'),
    timeout: 60,
  },
  {
    events: [
      {
        title: 'Virus se v teplém podnebí hůř šíří. Vědci předpokládají zpomalení pandemie.',
        choices: okButton({name: 'Teplé počasí', id: WARM_WEATHER_ID, duration: 120}),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-05-20', '2020-06-14')
      || dateBetween(ei.date, '2020-06-14', '2020-07-14'),
    timeout: 90,
  },
  {
    events: [
      {
        title: 'Konec teplého počasí',
        text: 'Jak teplota ovlivňuje šíření koronaviru? Chladné počasí počasí pomáhá šíření, tvrdí epidemiologové.',
        choices: okButtonEndMitigation(WARM_WEATHER_ID),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-09-10', '2020-10-09')
      || dateBetween(ei.date, '2020-10-09', '2020-11-09'),
    timeout: 90,
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
        choices: [
          // todo: fire -> postpone vaxination start
          simpleChoice('Vyhodit ministra', {vaccinationPerDay: -0.0001, duration: Infinity}),
          simpleChoice('Neřešit prohřešek', {stabilityCost: 5}),
        ],
      },
      {
        title: 'Odhalili jsme: předražené zakázky za miliardy!',
        text: 'Jeden z našich dodavatelů trasování si účtuje mnohem víc peněz než je v branži zvykem, ale zároveň jsme na jeho dodávkách závislí.',
        help: 'Pokud budeme nadále setrvávat s dosavadním dodavatelem, ztratíme na nevýhodných zakázkách více peněz. Bez těchto dodávek se ale zvýší hodnota R.',
        choices: [
          simpleChoice('Zůstat s dodavatelem', {economicCost: 5_000_000_000}),
          simpleChoice('Změnit dodavatele', {rMult: 1.05}),
        ],
      },
      {
        title: 'Nejsem ovce, nošení roušky odmítám! Přežijí silnější.',
        text: 'Významný politik veřejně odsuzuje nošení roušek a byl bez ní několikrát vyfocen v obchodě',
        help: 'Pokud významná politická osobnost nebude potrestána může to vést k menší disciplíně obyvatelstva při dodržování opatření, což může přinést, jak nové nakažené, tak negativně ovlivnit hodnotu R. Jeho potrestání však může pobouřit jeho příznivce a negativně tak ovlivnit společenskou stabilitu.',
        choices: [
          simpleChoice('Neřešit prohřešek', {rMult: 1.02, exposedDrift: random(1000, 2000)}),
          simpleChoice('Potrestat politika jako ostatní', {stabilityCost: 2}),
        ],
      },
      {
        title: 'Zažije Česko první volby ve znamení koronaviru?',
        help: 'Odložení voleb obyvatelstvo popudí a negativně se odrazí ve společenské stabilitě. Pokud volby proběhnou, přibude nakažených.',
        choices: [
          simpleChoice('Odložit volby', {stabilityCost: random(4, 8, true)}),
          simpleChoice('Nechat volby proběhnout', {exposedDrift: random(2000, 5000)}),
        ],
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-10-15', '2020-12-01'),
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
        choices: [
          simpleChoice('Otevřít skiareály', {exposedDrift: random(2000, 5000)}),
          simpleChoice('Neotevřít', {stabilityCost: 5}),
        ],
      },
      // Vánoční svátky
      {
        title: 'Vánoce během koronaviru: Jaké svátky nás letos čekají?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Lze očekávat, že udělení výjimek pro období svátků obyvatelé ocení a pozitivně se tak promítne do společenské stability, ale zato přinese větší počet nových nakažených. Přísná opatření se zase naopak setkají s nevolí obyvatel a poklesem společenské stability.',
        choices: [
          simpleChoice('Povolit půlnoční mše', {stabilityCost: -2, exposedDrift: random(500, 1500)}),
          simpleChoice('Udělit výjimku pro rodinná setkání nad 6 lidí', {stabilityCost: -2,
            exposedDrift: random(1000, 2000)}),
          simpleChoice('Povolit obojí', {stabilityCost: -5, exposedDrift: random(1500, 4000)}),
          simpleChoice('Zakázat půlnoční mše i rodinná setkání nad 6 lidí', {stabilityCost: 5}),
        ],
      },
      // Silvestr
      {
        title: 'Jak česko oslaví příchod nového roku v době pandemie covid-19?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Pokud budou opatření zpřísněna, lze očekávat vlnu nevole obyvatel a snížení společenské stability. Výjimky z opatření sice společenskou stabilitu lehce zvýší, ale povedou ke zvýšení počtu nemocných.',
        choices: [
          simpleChoice('Povolit večerní vycházení na Silvestra', {stabilityCost: -2,
            exposedDrift: random(10000, 20000)}),
          simpleChoice('Nepovolovat večerní vycházení na Silvestra', {stabilityCost: 5}),
        ],
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-12-02', '2020-12-20'),
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
        choices: okButton({stabilityCost: -10}),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-10-25', '2020-11-25'),
  },
  {
    events: [
      {
        title: 'Zmírní kampaň obavy z očkování proti covidu-19?',
        text: 'Je třeba se rozhodnout, zda budou investovány peníze do propagace očkování proti koronaviru.',
        help: 'Investice do kampaně pro očkování zvýší zájem o vakcinaci a tím pádem její rychlost. Je na ni však třeba vydat další náklady a zároveň se při možném neúspěchu kampaně  negativně ovlivní společenskou stabilitu. Odmítnutí proma vakcinaci zpomalí.',
        choices: [
          {
            label: 'Investovat do propagace vakcín',
            mitigations: [
              {id: VACCINATION_CAMPAIGN_ID, name: 'Vakcinační kampaň',
                vaccinationPerDay: 0.0001, duration: Infinity},
              {economicCost: 1_000_000_000},
            ],
          },
          simpleChoice('Neinvestovat', {vaccinationPerDay: -0.0001, duration: Infinity}),
        ],
      },
    ],
    // TODO timing randomization
    condition: (ei: EventInput) => ei.date >= '2021-01-01',
    timeout: 90,
  },
  {
    events: antivaxEventTexts.map(et =>
      ({
        title: et.title,
        text: et.text,
        help: 'Rychlost vakcinace se snižuje.',
        choices: okButton({vaccinationPerDay: -0.0002, duration: Infinity}),
      }),
    ),
    id: ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER,
    condition: (ei: EventInput) =>
      (ei.eventData.showAntivaxEvent && !isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID)),
    timeout: 7, // cannot occur more often than once every 7 days
  },
  {
    events: antivaxEventTexts.map(et =>
      ({
        title: et.title,
        text: et.text,
        help: 'Očkovací kampaň přestala fungovat.',
        choices: [
          {label: 'Ok', removeMitigationIds: [VACCINATION_CAMPAIGN_ID]},
        ],
      }),
    ),
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
        choices: [
          // total impact 5% vaccinated over 25 days
          simpleChoice('Přijmout zahraniční pomoc',
            {name: 'Zahraniční pomoc v očkování', vaccinationPerDay: 0.002, duration: 25}),
          simpleChoice('Nepřijmout zahraniční pomoc', {stabilityCost: 5}),
        ],
      },
    ],
    condition: (ei: EventInput) => (randomDateBetweenTrigger(ei.date, '2021-06-15', '2021-06-30')
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
