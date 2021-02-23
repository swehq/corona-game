import {EventChoiceDef, EventInput, EventMitigation, EventTrigger} from './events';
import {dateDiff, indexByFraction} from './utils';
import {isNil} from 'lodash';

export const maxMitigationDuration = Number.MAX_SAFE_INTEGER;

// Event mitigation IDs
const TUTORIAL_ID = 'tutorial';
const SELF_ISOLATION_ID = 'selfIsolation';
const VACCINATION_CAMPAIGN_ID = 'vaccinationCampaign';
const VACCINATION_CAMPAIGN_PAID_ID = 'vaccinationCampaignPaid';
const AUTUMN_2020_MINISTER_FIRED_ID = 'autumn2020MinisterFired';
const SPRING_2021_DATA_LEAK_ID = 'spring2021DataLeak';
const SPRING_2021_SECURITY_PROBLEM_ID = 'spring2021SecurityProblem';

// Event trigger IDs
const SELF_ISOLATION_TRIGGER = 'selfIsolation';

// Winter events
const WINTER_EVENTS = ['skiareals', 'christmas', 'newYear'] as const;
type WinterEvent = typeof WINTER_EVENTS[number];

const selfIsolationThreshold = 2000 / 7;
const selfIsolationMitigation1 = {rMult: 0.8, economicCost: 200_000_000};

// LCG pseudorandom number generator parameters for event randomization
const LCG_A = 1_664_525;
const LCG_C = 1_013_904_223;
const LCG_M = Math.pow(2, 32);
let randomness = 0; // Will be seeded every sim day

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
    return probability(1 / (1 - dateDiff(date, dateTo)));
  } else {
    // after given interval
    return false;
  }
}

/**
 * Return true with given probability
 * @param probabilityRate - probability between 0..1 (e.g 0.05 means probability 5%)
 */
function probability(probabilityRate: number) {
  randomness = (randomness * LCG_A + LCG_C) % LCG_M;
  return probabilityRate * LCG_M > randomness;
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
 * Returns true if EventMitigation is active and it will expire on this day
 * @param eventInput - EventInput
 * @param id - Id of the EventMitigation
 */
function isEventMitigationLastDay(eventInput: EventInput, id: string) {
  const mitigation = eventInput.eventMitigations.find(em => em.id === id && em.duration === 1);
  return !isNil(mitigation);
}

/**
 * Returns true if EventTrigger is active
 * @param eventInput - EventInput
 * @param id - Id of the EventTrigger
 */
function isEventTriggerActive(eventInput: EventInput, id: string) {
  const triggerState = eventInput.triggerStates.find(ts => ts.trigger.id === id);
  return !isNil(triggerState) &&
    (triggerState.activeBefore === undefined
      || triggerState.trigger.reactivateAfter !== undefined
        && triggerState.activeBefore >= triggerState.trigger.reactivateAfter);
}

export interface EventData {
  winterEvent: WinterEvent;
  aboveSelfIsolationThresholdDays: number;
  belowSelfIsolationThresholdDays: number;
  minStability: number;
  daysBusinessesRestricted: number;
}

export function initialEventData(randomSeed: number): EventData {
  return {
    winterEvent: indexByFraction(WINTER_EVENTS, randomSeed) as WinterEvent, // sample returns WinterEvent | undefined
    aboveSelfIsolationThresholdDays: 0,
    belowSelfIsolationThresholdDays: 0,
    minStability: 100,
    daysBusinessesRestricted: 0,
  };
}

/**
 * Callback that is called every day before trigger conditions are evaluated
 * @param eventInput - EventInput
 */
export function updateEventData(eventInput: EventInput) {
  const eventData = eventInput.eventData;

  // Init (pseudo-)random number generator seed for events every day
  // detectedInfections should be good enough source of randomness
  randomness = Math.floor(eventInput.randomSeed * LCG_M);

  // Used for self-isolation
  if (eventInput.stats.deaths.avg7Day >= selfIsolationThreshold) {
    eventData.aboveSelfIsolationThresholdDays++;
    eventData.belowSelfIsolationThresholdDays = 0;
  } else {
    eventData.aboveSelfIsolationThresholdDays = 0;
    eventData.belowSelfIsolationThresholdDays++;
  }

  // Stability
  eventData.minStability = Math.min(eventInput.stats.stability, eventData.minStability);

  // Number days businesses were restricted
  if (eventInput.mitigations.businesses) eventData.daysBusinessesRestricted++;
}

function simpleChoice(buttonLabel: string, mitigation?: Partial<EventMitigation>,
  chartLabel?: string): EventChoiceDef {
  const mitigations = mitigation ? [mitigation] : undefined;
  return {buttonLabel, chartLabel, mitigations};
}

function okButton(mitigation?: Partial<EventMitigation>, chartLabel?: string): [EventChoiceDef] {
  return [simpleChoice('OK', mitigation, chartLabel)];
}

function okButtonEndMitigation(id: string, chartLabel?: string): [EventChoiceDef] {
  return [{buttonLabel: 'OK', chartLabel, removeMitigationIds: [id]}];
}

const antivaxEventTexts = [
  {
    title: 'Vakcína neprošla dostatečným testováním, tvrdí lékař',
    text: 'Lidé mají strach, že nová vakcína proti koronaviru je nedostatečně testovaná, a očkování proto odmítají.',
  },
  {
    title: 'Celebrity sepsaly petici proti očkování',
    text: 'Odpor vůči očkování se šíří.',
  },
  {
    title: 'Lékař zemřel po očkování',
    text: 'Lékař v USA zemřel po očkování. Detaily případu jsou zatím neznámé, občané se obávají očkování.',
  },
  {
    title: 'Horečky, průjmy: Občané popisují první pociťované vedlejší účinky vakcíny',
    text: 'Lidé mají strach z vedlejších účinků očkování a vakcínu proto odmítají.',
  },
  {
    title: 'Lékař ukázal pět jednoduchých triků jak vyléčit koronavirus doma',
    text: 'Kardiolog na svém populárním blogu dokazuje, že drtivá většina lidí se může snadno uzdravit sama a nepotřebuje očkování.',
  },
];

export const tutorialEvents: EventTrigger[] = [
  /****************************************************************************
   *
   * Tutorial events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Grafy (v tomto panelu)',
        text: '<p>Hlavní zdroj informací o aktuální situaci ve státě. Překlikávat můžete mezi čtyřmi různými grafy. Nejdůležitější je však graf nově nakažených.</p>\
<p>Po skončení tutorialu klikněte na otazník v tomto panelu a přečtěte si více.</p>',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Rychlost hry a základní statistiky (první panel)',
        text: '<p>Tento panel umožňuje hru zrychlovat, zpomalovat nebo případně pozastavit tlačítkem pauza.</p>\
<p>Zároveň zde můžete sledovat hodnotu společenské stability a kapacitu nemocnic.</p>\
<p>Věnujte pozornost tomu, proč jsou pro vás společenská stabilita a kapacita nemocnic důležité. Klikněte na otazník v panelu rychlostí.</p>',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Panel opatření',
        text: '<p>Zde naleznete svůj hlavní nástroj k zvládání pandemie. Aktivní opatření jsou označena modře, šedá naopak znamená, že opatření aktuálně není zavedeno.</p>\
<p>Najeďte na otazník v panelu opatření a přečtěte si více o fungování opatření a kompenzacích.</p>',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Teď je to jen na vás',
        help: '<p>A tím končí naše krátká cesta po ovládání hry. Jakmile stisknete OK, bude už na vás, jak si s pandemií poradíte. Ale nebojte, ve všech mimořádných situacích se vám pokusíme nabídnout radu. Hodně štěstí!<p>\
<p><strong>Po zavření tohoto okna spustíte hru v panelu nahoře</strong></p>',
        choices: [
          {
            buttonLabel: 'OK',
            action: 'pause',
          },
        ],
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
];

export const czechiaEventTriggers: EventTrigger[] = [
  ...tutorialEvents,
  {
    events: [
      {
        title: 'První případ nákazy koronavirem v Česku!',
        text: '<p>Řešení této situace máte teď ve svých rukou. Pamatujte, že:</p>\
<ul>\
  <li>Opatření různou měrou ovlivňují šíření koronaviru</li>\
  <li>Nějaký čas trvá, než se opatření na množství nakažených projeví</li>\
  <li>Kliknutí na otazníky u panelů otevře nápovědu</li>\
  <li><strong>Rychlost hry ovládáte v panelu nahoře</strong></li>\
</ul>',
        help: 'Modrá barva značí nezávazné rady průvodce. Naložte s nimi dle svého!',
        choices: [
          simpleChoice('Ukázat ovládání', {id: TUTORIAL_ID, duration: maxMitigationDuration}),
          {
            buttonLabel: 'Hrát',
            action: 'pause',
          },
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-03-01',
  },
  /****************************************************************************
   *
   * Stability events
   *
   ****************************************************************************/
  // Krize a bonusy duvery
  {
    events: [
      {
        title: 'Češi důvěřují vládě!',
        help: 'Vypadá to, že jste získali zpět důvěru obyvatel. Nemusíte se teď obávat příliš negativních reakcí při zavádění opatření.',
      },
    ],
    condition: (ei: EventInput) => ei.eventData.minStability <= 50 && ei.stats.stability >= 75,
  },
  {
    events: [
      {
        title: 'Lidem dochází trpělivost! Nevěří vládním rozhodnutím.',
        help: 'Vaše volba opatření otřásla důvěrou obyvatel. Nezapomínejte, že opatření mají vliv na společenskou stabilitu. Když budou příliš přísná a budou trvat dlouho, lidé začnou být nespokojení.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 75,
  },
  {
    events: [
      {
        title: 'Frustrace a zklamání společnosti',
        help: 'Pozor, ve společnosti to začíná vřít! Doporučujeme se zaměřit na stav společenské stability.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 50,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá vládu k rezignaci!',
        help: 'Pozor, situace je velmi špatná. Další pokles stability může hru předčasně ukončit. Co k situaci vedlo? Vysoký počet zemřelých vyžaduje zpřísnění opatření. Naopak příliš přísná opatření může být nutné uvolnit nebo začít kompenzovat.',
        choices: okButton({...selfIsolationMitigation1, name: 'Výzvy k rezignaci', duration: 30}),
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 20,
    reactivateAfter: 90,
  },
  /****************************************************************************
   *
   * Economic events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Česko se příliš zadlužuje!',
        help: 'Hra měří, jak moc zadlužujete stát i kolik ztrácí jednotlivé podniky vlivem situace a opatření. Velmi vysoké výdaje mohou mít negativní vedlejší dopady.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 300_000_000_000,
  },
  {
    events: [
      {
        title: 'Výše státního dluhu je hrozivá!',
        help: 'Krize má vysoké náklady. V tuto chvíli nás pandemie stojí téměř půlku státního rozpočtu České republiky za rok 2019.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 750_000_000_000,
  },
  {
    events: [
      {
        title: 'Státní dluh je nejvyšší v historii!',
        help: 'Výdaje spojené s pandemií koronaviru dosáhly součtu výdajů státního rozpočtu. Státní dluh a nezaměstnanost jsou rekordní, hodnota koruny rychle klesá.',
        choices: okButton({stabilityCost: 6}, 'Historický státní dluh'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 1_535_000_000_000,
  },
  {
    events: [
      {
        title: 'Hrozba státního bankrotu a hyperinflace!',
        help: 'Běžná ekonomika je v troskách, řetězce vztahů mezi firmami přestávají fungovat. Ve společnosti panuje široká nespokojenost.',
        choices: okButton({stabilityCost: 30}),
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 3_000_000_000_000,
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
        title: 'Covid zabil {{stats.deaths.today}} lidí za pouhý den',
        help: 'Vypadá to, že to není pouhá chřipka. Je ke zvážení zapnout v panelu vpravo nahoře opatření, která mohou šíření viru zpomalit. Ti, kteří nemoc přežijí, budou nějakou dobu imunní.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 10,
  },
  // pocet mrtvych za den: 100+
  {
    events: [
      {
        title: 'Rekordní denní počet úmrtí nakažených covidem',
        help: 'Stovka mrtvých denně zasévá do společnosti otázky, jestli vláda zvládá situaci. Podívejte se v panelu vpravo nahoře, zda máte zavedena dostatečná opatření.',
        choices: okButton({stabilityCost: 2}, 'Rekordní denní úmrtí'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 100,
  },
  // pocet mrtvych za den: 750+
  {
    events: [
      {
        title: '{{stats.deaths.today}} mrtvých za den, většině krematorií dochází kapacity',
        help: 'Takto rychlé přibývání obětí obyvatelstvo šokuje. Více obětí denně už by přijali jen velmi těžko.',
        choices: okButton({stabilityCost: 5}, 'Kapacita krematorií překročena'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 750,
  },
  // pocet mrtvych za den: 1500+
  {
    events: [
      {
        title: 'Temné predikce se naplnily: přes 1500 mrtvých za den. Armáda kope masové hroby.',
        help: 'Více než 1 500 mrtvých denně je na stát s deseti miliony občanů velmi špatnou zprávou. Společnost je v šoku.',
        choices: okButton({stabilityCost: 30}),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 1500,
  },
  // pocet mrtvych celkem: 10000+
  {
    events: [
      {
        title: 'Covid v Česku usmrtil přes 10 000 lidí',
        help: 'Překonání hranice deseti tisíc mrtvých přináší nedůvěru ve vládu. Lidé se ale také nějakou dobu raději sami více hlídají. Ekonomická aktivita i šíření infekce na dva týdny klesá.',
        choices: [
          {
            buttonLabel: 'OK',
            mitigations: [
              {stabilityCost: 5},
              {...selfIsolationMitigation1, duration: 14},
            ],
          },
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.total >= 10000,
  },
  // pocet mrtvych celkem: 100000+
  {
    events: [
      {
        title: 'Další tragický milník: Česko překonalo hranici 100 000 zemřelých na covid-19',
        help: 'Sto tisíc mrtvých představuje tragické světové prvenství a nevídanou ztrátu životů. Tento milník lidi staví proti vládě. Zároveň ale po dva týdny budou opatrnější.',
        choices: [
          {
            buttonLabel: 'OK',
            mitigations: [
              {stabilityCost: 10},
              {...selfIsolationMitigation1, duration: 14},
            ],
          },
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.total >= 100_000,
  },
  // malo mrtvych / demostrance
  {
    events: [
      {
        title: 'Demonstrace odpůrců vládních opatření: neměli roušky, nedodržovali rozestupy',
        help: 'Demonstranti v centru Prahy nedodržují zavedená opatření. Jejich pozatýkání ale může pobouřit veřejnost. Pokud však protesty proběhnou bez zásahu, hrozí, že přibude velké množství nakažených.',
        choices: [
          simpleChoice('Nechat protesty proběhnout', {rMult: 1.2, exposedDrift: 50, duration: 14}),
          simpleChoice('Pozatýkat', {stabilityCost: 2}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 40 && ei.stats.deaths.avg7Day < (500 / 7),
  },
  // Hospital capacity warning
  {
    events: [
      {
        title: 'Nemocnice varují před náporem nemocných',
        text: 'Nemocnice mají jen omezenou kapacitu - a varují, že pokud bude nemocných příliš, nemohou se o ně postarat.',
        help: 'Pokud překročíte kapacitu nemocnic, smrtnost nemoci výrazně stoupne.',
        choices: okButton(),
      },
    ],
    condition: (ei: EventInput) => ei.stats.hospitalsUtilization > 0.85,
  },
  // Tracking capacity warning
  {
    events: [
      {
        title: 'Hygienické stanice přestávají stíhat',
        text: 'Státní hygienické stanice zvládnou v naší hře trasovat přesně tisíc lidí denně. Pokud by váš denní přírůstek nakažených byl vyšší, začne trasování selhávat.',
        help: 'Překonání hranice tisíce nakažených denně a s ním pád trasování může být podstatným mezníkem nezvládání pandemie. V našem modelovém státě není možné kapacitu trasování zvyšovat.',
        choices: okButton(),
      },
    ],
    condition: (ei: EventInput) => ei.stats.detectedInfections.today > 650,
  },
  // Self isolation
  {
    events: [
      {
        title: 'Tisíce obětí za poslední týden a mrtvých stále přibývá!',
        text: 'Kritická situace vede obyvatele k větší izolaci tam, kde je to možné.',
        help: 'Izolace obyvatel znamená, že výrazně méně nakupují či pracují a jsou výrazně opatrnější. Nemoc se bude šířit mnohem pomaleji, ale ne vaší zásluhou.',
        // cost = 1.5 * cost of lockdown (values taken from game.ts)
        // TODO get values from game.ts
        // rMult is applied everyDay!
        choices: okButton({
          id: SELF_ISOLATION_ID, rMult: 0.7, economicCost: 3.5 * 1.5 * 1_000_000_000,
          duration: maxMitigationDuration,
          stabilityCost: (0.2 + 0.15 + 0.05 + 0.15) * 1.5,
          name: 'Dobrovolná izolace',
        }, 'Dobrovolná izolace'),
      },
    ],
    condition: (ei: EventInput) => (!isEventMitigationActive(ei, SELF_ISOLATION_ID)
      && probability(ei.eventData.aboveSelfIsolationThresholdDays * 0.05)),
    reactivateAfter: 21, // End isolation will not trigger until this reactivates
    id: SELF_ISOLATION_TRIGGER,
  },
  {
    events: [
      {
        title: 'Život v zemi se vrací do normálu.',
        help: 'Izolace obyvatel skončila.',
        // End isolation
        choices: okButtonEndMitigation(SELF_ISOLATION_ID, 'Konec dobrovolné izolace'),
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, SELF_ISOLATION_ID)
      && ei.eventData.belowSelfIsolationThresholdDays >= 7
      && isEventTriggerActive(ei, SELF_ISOLATION_TRIGGER),
    reactivateAfter: 1,
  },
  /****************************************************************************
   *
   * Seasonal events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Školáci dnes dostávají vysvědčení a začínají jim prázdniny',
        help: 'Žáci a studenti se o prázdninách ve školách nepotkávají. Opatření “uzavření škol” bylo aktivováno bez dalších nákladů.',
        choices: okButton(undefined, 'Začátek prázdnin'),
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-06-30',
    reactivateAfter: 60,
  },
  {
    events: [
      {
        title: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět zvyšuje náklady a snižuje společenskou stabilitu. Můžete je nechat zavřené, ale opatření už nebude automatické a zdarma.',
        choices: okButton(undefined, 'Konec prázdnin'),
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-09-01',
    reactivateAfter: 60,
  },
  {
    events: [
      {
        title: 'Virus se v teplém počasí hůř šíří. Vědci předpokládají zpomalení pandemie',
        help: 'V létě tráví lidé více času venku a šance se nakazit je přirozeně snížená. Možná je teď vhodný čas uvolnit některá opatření. ',
        choices: okButton(undefined, 'Teplé počasí'),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-05-20', '2020-06-14'),
    reactivateAfter: 90,
  },
  {
    events: [
      {
        title: 'Chladné počasí pomáhá šíření koronaviru, tvrdí epidemiologové',
        help: 'V chladném počasí se lidé více potkávají v malých prostorách a virus se šíří rychleji. Jeden nakažený zvládne nakazit více lidí. Možná je vhodný čas zavést opatření.',
        choices: okButton(undefined, 'Konec teplého počasí'),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-09-10', '2020-10-09'),
    reactivateAfter: 90,
  },
  /****************************************************************************
   *
   * Government gets report card at the end of the school year
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Vláda dostala vysvědčení',
        text: '\
<p>Několik dní před tím, než dostanou vysvědčení školáci, je příležitost hodnotit i vaše působení ve vládě od začátku pandemie.</p>\
<p>Ve skutečné České republice došlo k 30. 6. 2020 k 347 úmrtím osob hospitalizovaných s nemocí covid-19. Vám v simulaci zemřelo {{stats.deaths.total}} osob.</p>',
        help: 'První vlna může být překvapivá a nepříjemná. Možná nejste spokojeni s tím, jak se vám povedla a chcete to zkusit znovu, pak stačí zmáčknout <em>Restart</em>. Pokud chcete pokračovat dál, zmáčkněte <em>Jedeme dál</em>.',
        choices: [
          simpleChoice('Jedeme dál'),
          {
            buttonLabel: 'Restart',
            action: 'restart',
          },
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-06-28',
    reactivateAfter: 90,
  },
  /****************************************************************************
   *
   * Autumn package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Ministr porušil svá vlastní pravidla, nakupoval zcela bez roušky',
        help: 'Pokud ministr po porušení vlastních nařízení setrvá na místě, mohou se obyvatelé bouřit, což znamená pokles společenské stability. Vyhození ministra, který je ve své práci již zaběhlý, může ale výrazně zkomplikovat řízení ministerstva a s tím třeba očkování.',
        choices: [
          simpleChoice('Vyhodit ministra', {id: AUTUMN_2020_MINISTER_FIRED_ID, duration: maxMitigationDuration}),
          simpleChoice('Neřešit prohřešek', {stabilityCost: 5}),
        ],
        condition: (ei: EventInput) => ei.mitigations.rrr,
      },
      {
        title: 'Nebudu se podřizovat bludům. Roušku odmítám',
        text: 'Celebrita veřejně odsuzuje nošení roušek a byla bez ní několikrát vyfocena v obchodech. Část médií žádá pokutu.',
        help: 'Pokud osobnost nebude potrestána, může to vést k menší disciplíně obyvatel a vyššímu šíření nemoci. Potrestání však může pobouřit jeho příznivce a negativně tak ovlivnit společenskou stabilitu.',
        choices: [
          simpleChoice('Neřešit prohřešek',
            {name: 'Celebrita odmítá roušku', rMult: 1.1, duration: 30}, 'Celebrita nenosí roušku'),
          simpleChoice('Potrestat celebritu jako ostatní', {stabilityCost: 3}),
        ],
        condition: (ei: EventInput) => ei.mitigations.rrr,
      },
      {
        title: 'Násobně předražené nákupy odhaleny!',
        text: 'Jeden z našich dodavatelů lékařského vybavení si účtuje mnohem víc peněz než je v branži zvykem, ale zároveň jsme na jeho dodávkách závislí. Změna může krátkodobě znamenat výpadek dodávek a s ním větší šíření nemoci.',
        help: 'Pokud budeme nadále setrvávat s dosavadním dodavatelem, ztratíme na nevýhodných zakázkách více peněz. Bez těchto dodávek se ale bude nemoc krátkodobě více šířit.',
        choices: [
          simpleChoice('Zůstat s dodavatelem', {economicCost: 5_000_000_000}),
          simpleChoice('Změnit dodavatele', {name: 'Změna dodavatele', rMult: 1.1, duration: 30}),
        ],
      },
      {
        title: 'Zažije Česko první místní volby ve znamení koronaviru?',
        help: 'Radikální proměny volebního procesu obyvatelstvo popudí a zvýší nedůvěru. Pokud volby proběhnou jako vždy, riskujeme šíření nemoci.',
        choices: [
          simpleChoice('Korespondenční volby', {stabilityCost: 5}),
          {
            buttonLabel: 'Prezenční volby',
            chartLabel: 'Prezenční volby',
            mitigations: [
              {name: 'Volby', rMult: 1.3, duration: 14},
              {exposedDrift: 500},
            ],
          },
        ],
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-10-15', '2020-12-01'),
  },
  {
    events: [
      {
        title: 'Zmatky na ministerstvu',
        text: 'Nedávná výměna ministra způsobila zmatky v očkování.',
        help: 'Očkování se zpomalilo',
        choices: okButton({vaccinationPerDay: -1, duration: 10}, 'Zmatky v očkování'),
      },
    ],
    condition: (ei: EventInput) => ei.date === '2021-01-05'
      && isEventMitigationActive(ei, AUTUMN_2020_MINISTER_FIRED_ID),
  },
  /****************************************************************************
   *
   * Winter package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Vláda se zabývá možností otevření skiaeálů',
        text: 'Otevření skiareálů? Vlekaři volají po výjimce, epidemiologové radí: zavřít!',
        help: 'Zavření skiareálů rozčílí hodně lidí a připraví je o oblíbené zimní sporty. Jejich otevření ale může vést k vyššímu riziku šíření.',
        choices: [
          simpleChoice('Otevřít skiareály', {name: 'Skiareály', rMult: 1.2, duration: 60}),
          simpleChoice('Neotevřít', {stabilityCost: 5}, 'Otevřít skiareály'),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.eventData.winterEvent === 'skiareals'
      && randomDateBetweenTrigger(ei.date, '2020-12-02', '2020-12-20'),
  },
  {   // Vánoční svátky
    events: [
      {
        title: 'Vánoce během koronaviru: Jaké svátky nás letos čekají?',
        text: 'Pro období svátků je možné zavést speciální opatření (aby se zamezilo většímu setkávání), nebo naopak udělit zvláštní výjimky.',
        help: 'Výjimku z opatření velká část obyvatel ocení. Více scházení ale znamená rychlejší šíření nemoci. Zamezit šíření se dá zpřísněním opatření. To ale může obyvatele popudit.',
        choices: [
          {
            buttonLabel: 'Povolit půlnoční i rodinná setkání',
            mitigations: [
              {stabilityCost: -5},
              {name: 'Vánoce', rMult: 1.5, duration: 7},
            ],
          },
          simpleChoice('Zakázat', {stabilityCost: 5}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.eventData.winterEvent === 'christmas' && ei.date === '2020-12-22',
  },
  { // Silvestr
    events: [
      {
        title: 'Jak česko oslaví příchod nového roku?',
        text: 'Pro období svátků je možné zpřísnit opatření (aby se zamezilo většímu setkávání), nebo naopak udělit výjimky z opatření.',
        help: 'Výjimku z opatření velká část obyvatel ocení. Více scházení ale znamená rychlejší šíření nemoci. Zamezit šíření se dá zpřísněním opatření. To ale může obyvatele popudit.',
        choices: [
          {
            buttonLabel: 'Povolit večerní vycházení na Silvestra',
            chartLabel: 'Silvestr',
            mitigations: [
              {stabilityCost: -2},
              {name: 'Silvestr', rMult: 1.5, duration: 3},
            ],
          },
          simpleChoice('Nepovolovat', {stabilityCost: 4}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.eventData.winterEvent === 'newYear' && ei.date === '2020-12-30',
  },
  /****************************************************************************
   *
   * Spring 2021 package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Únik dat způsobený neopatrností!',
        help: 'Únik dat z očkovacího registračního systému může způsobit mnoho problémů všem stranám. Pokud přiznáte pochybení, lidé budou rozčilení. Pokud jej popřete, mohou nastat dvě situace: buď budete odhaleni a obyvaté budou popuzeni výrazně více, nebo vám lež projde, hrstka lidí si bude stěžovat, ale národ zůstane uklidněn.',
        choices: [
          simpleChoice('Přiznat chybu', {stabilityCost: 3}),
          {
            buttonLabel: 'Oznámit, že je vše pod kontrolou',
            mitigations: [
              {stabilityCost: -3},
              {id: SPRING_2021_DATA_LEAK_ID, duration: 7},
            ],
          },
        ],
      },
      {
        title: 'Odhalení fatální bezpečnostní díry očkovacího systému',
        help: 'Okamžité stažení systému je bezpečná varianta, která s sebou ale nese zpoždění očkování o dva týdny. Pokud se pokusíte obyvatele uklidnit, problém popřít a nechat systém nasazený, může (ale nemusí) se stát, že zranitelný systém bude nabourán a očkování se pozdrží o výrazně delší dobu.',
        choices: [
          simpleChoice('Okamžitě stáhnout systém',
            {vaccinationPerDay: -1, duration: 14},
            'Pozastaven očkovací systém'),
          {
            buttonLabel: 'Uklidnit obyvatele',
            mitigations: [
              {id: SPRING_2021_SECURITY_PROBLEM_ID, duration: 7},
            ],
          },
        ],
      },
      {
        title: 'Hackeři zaútočili na systém registrace očkování',
        help: 'Hackeři vyžadují výkupné za napadený systém. Buď jim částku zaplatíte, nebo je odmítnete, ale náprava škod bude trvat další týden, po který nebude možné se registrovat k očkování.',
        choices: [
          simpleChoice('Zaplatit 10 miliónů' , {economicCost: 10_000_000}),
          simpleChoice('Odmítnout', {vaccinationPerDay: -1, duration: 7}, 'Hackeři'),
        ],
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2021-02-13', '2021-02-16'),
  },
  {
    events: [
      {
        title: 'Novinář odhalil masivní únik dat z očkovacího systému',
        help: 'Únik dat z očkovacího registračního se nepodařilo utajit',
        choices: okButton({stabilityCost: 9}),
      },
    ],
    condition: (ei: EventInput) => isEventMitigationLastDay(ei, SPRING_2021_DATA_LEAK_ID) && probability(0.5),
  },
  {
    events: [
      {
        title: 'Bezpečnostní chyba způsobila zhroucení očkovacího systému',
        help: 'Očkování se zpomalilo',
        choices: okButton({vaccinationPerDay: -1, duration: 30}, 'Zhroucení očkovacího systému'),
      },
    ],
    condition: (ei: EventInput) => isEventMitigationLastDay(ei, SPRING_2021_SECURITY_PROBLEM_ID) && probability(0.3),
  },
  /****************************************************************************
   *
   * Virus mutation
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Přichází nová mutace viru',
        help: 'Nová mutace viru se šíří rychleji. \
Dejte si větší pozor na počet nakažených a zvažte přísnější opatření.',
        choices: okButton({rMult: Math.sqrt(1.4), duration: maxMitigationDuration}),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2021-02-12', '2021-02-28'),
  },
  {
    events: [
      {
        title: 'Zmutovaný koronavirus v zemi dominuje!',
        help: 'Nová mutace viru už je v zemi hojně rozšířená. Virus je výrazně nakažlivější.',
        choices: okButton({rMult: Math.sqrt(1.4), duration: maxMitigationDuration}),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2021-03-01', '2021-03-08'),
  },
  /****************************************************************************
   *
   * Vaccination events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Testování vakcín v poslední fázi. Státy EU objednaly miliony očkovacích dávek.',
        help: 'Úspěšný vývoj vakcín a jejich nákup nabízí možnost získání imunity bez prodělání nemoci. Lidé jsou nadšení, že vidí světlo na konci tunelu. Starostí vašeho ministerstva pak není distribuce, ale pouze propagace vakcín. Distribuci a vše další zařídí kolegové nezávisle na vašich rozhodnutích. Teď už stačí vydržet..',
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
        help: 'Investice do kampaně pro očkování zvýší zájem o vakcinaci a tím pádem její rychlost. Je na ni však třeba vydat další náklady a zároveň riskujeme, že úředníci veřejnost spíše popudí.',
        choices: [
          {
            buttonLabel: 'Investovat do propagace vakcín',
            mitigations: [
              {id: VACCINATION_CAMPAIGN_ID, name: 'Vakcinační kampaň',
                vaccinationPerDay: 0.0001, duration: maxMitigationDuration},
              {id: VACCINATION_CAMPAIGN_PAID_ID, economicCost: 1_000_000_000},
            ],
          },
          simpleChoice('Neinvestovat', {vaccinationPerDay: -0.0001, duration: maxMitigationDuration}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-12-01' || ei.date > '2021-01-01' && probability(0.05),
    reactivateAfter: 80,
  },
  {
    events: [
      {
        title: 'Vládní kampaň odrazuje občany',
        text: 'Mysleli jsme to dobře, ale dopadlo to... nedobře.',
        help: 'Každá propagační kampaň v sobě nese riziko selhání. Teď na něj došlo.',
        choices: [
          {buttonLabel: 'OK', removeMitigationIds: [VACCINATION_CAMPAIGN_ID]},
        ],
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, VACCINATION_CAMPAIGN_PAID_ID)
      && probability(0.25),
    reactivateAfter: 1,
  },
  {
    events: antivaxEventTexts.map(et =>
      ({
        title: et.title,
        text: et.text,
        help: 'Lidé se bojí. Rychlost vakcinace se na krátkou dobu výrazně snižuje.',
        choices: okButton({vaccinationPerDay: -1, duration: 14}),
        condition: (ei: EventInput) => !isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID),
      }),
    ).concat(antivaxEventTexts.map(et =>
      ({
        title: et.title,
        text: et.text,
        help: 'Očkovací kampaň přestala fungovat.',
        choices: [
          {buttonLabel: 'OK', removeMitigationIds: [VACCINATION_CAMPAIGN_ID]},
        ],
        condition: (ei: EventInput) => isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID),
      }),
    )),
    condition: (ei: EventInput) => ei.date > '2021-01-10' && probability(0.02),
    reactivateAfter: 7, // cannot occur more often than once every 7 days
  },
  {
    events: [
      {
        title: 'Tři sousední země překročily hranici 75% proočkování populace',
        text: 'Sousední země mají proočkováno a nabízejí pomoc s očkováním v ČR.',
        help: 'Přijetí zahraniční pomoci urychlí vakcinaci a zvedne o několik procent proočkovanost ČR. Její odmítnutí rozčílí část společnosti.',
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
        choices: okButton(undefined, '1/2 očkována'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.vaccinationRate > .5,
  },
  /****************************************************************************
   *
   * Small business restrictions
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Pokud se teď opatření nerozvolní, neotevřeme už nikdy',
        text: 'Kavárník Pavel: „S bratrem jsme si splnili sen. Našli jsme skvělý prostor a investovali do něj spoustu energie i peněz. Teď řešíme, jak splatit nájmy.“',
        help: 'Přibývá lidí, kteří se nyní musí obávat o svoji živnost a budoucnost. Poskytnutí speciální podpory bude stát mnoho peněz. Pokud pomoc odmítnete, řada podniků ale nepřežije.',
        choices: [
          simpleChoice('Dotovat nájmy', {economicCost: 21_000_000_000, stabilityCost: -3}),
          simpleChoice('To si nemůžeme dovolit', {stabilityCost: 5}),
        ],
      },
      {
        title: 'Diváci si zvykají na svůj obývák a Netflix',
        text: 'Producenti posouvají premiéry na další rok nebo rovnou na internet. Zabije koronavirus kina? Provozovatelé žádají půjčky na dva roky provozu.',
        help: 'Pandemie vyprázdnila multikina i místní sály a není ani příliš co promítat. Půjčky kinosálům je zachrání před krachem, ale otázka je, jestli se peníze někdy vrátí.',
        choices: [
          simpleChoice('Úvěr kinosálům', {economicCost: 7_000_000_000, stabilityCost: -1}),
          simpleChoice('To si nemůžeme dovolit', {stabilityCost: 2}),
        ],
      },
      {
        title: '„Kousli jsme se. Další vlnu už ale nezvládneme“',
        text: 'Martin a Petra vedou malou hračkářskou dílnu. Prodej přes internet ale nestačí na to, aby zvládali zaplatit zaměstnancům.',
        help: 'Situace těžce dopadá na drobné podnikatele a ti nemají na výplaty zaměstnanců. Pokud je nepodpoříte, řada jich zkrachuje.',
        choices: [
          simpleChoice('Dotovat výplaty', {economicCost: 33_000_000_000, stabilityCost: -5}),
          simpleChoice('To si nemůžeme dovolit', {stabilityCost: 5}),
        ],
      },
      {
        title: 'Krámky na rohu jsou prázdné, velké řetězce sčítají zisky',
        help: 'Místní podniky nedokáží konkurovat nabídce a možnostem dopravy velkých firem. Poskytnutí speciální podpory bude stát mnoho peněz. Pokud pomoc odmítnete, řada podniků nepřežije.',
        choices: [
          simpleChoice('Dotovat malé podniky', {economicCost: 30_000_000_000, stabilityCost: -5}),
          simpleChoice('To si nemůžeme dovolit', {stabilityCost: 5}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.eventData.daysBusinessesRestricted > 60,
  },
  /****************************************************************************
   *
   * End screen
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Vláda padla kvůli fatálnímu neúspěchu při řešení koronavirové krize',
        text: 'Vaše hra v roli vlády skončila. Hodnota společenské stability dosáhla svého minima, došlo k pádu vlády a vy jste tak ztratili možnost ovlivňovat řešení šíření pandemie covid-19.',
        help: 'Proč se tak stalo? Jedním z důvodů může být to, že jste drželi velmi přísná opatření příliš dlouhou dobu. Stabilita také rychleji klesá ve chvíli, kdy se počty mrtvých zvyšují na číslo neúnosné pro obyvatele.',
        choices: [simpleChoice('Zobrazit výsledky')],
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 0,
  },
];

// Mutation scenario
export const czechiaB117EventTriggers: EventTrigger[] = [
  ...tutorialEvents,
  {
    events: [
      {
        title: 'Aktulní situace v ČR',
        text: 'Připravili jsme pro vás scénář hry s aktuální situací v ČR. V průběhu února v zemi převážila britská mutace B.1.1.7 a dosavadní opatření již nedostačují.',
        choices: [
          simpleChoice('Ukázat ovládání', {id: TUTORIAL_ID, duration: maxMitigationDuration}),
          {
            buttonLabel: 'Hrát',
            action: 'pause',
          },
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2021-02-01',
  },
  {
    events: [
      {
        title: 'Zmutovaný koronavirus v zemi dominuje!',
        help: 'Nová mutace viru už je v zemi hojně rozšířená. Virus je výrazně nakažlivější.',
        choices: okButton(),
      },
    ],
    condition: (ei: EventInput) => ei.date === '2021-02-14',
  },
];
