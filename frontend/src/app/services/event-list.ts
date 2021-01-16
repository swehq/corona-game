import {EventChoiceDef, EventInput, EventMitigation, EventTrigger} from './events';
import {dateDiff} from './utils';
import {isNil, random} from 'lodash';

// Event mitigation IDs
const TUTORIAL_ID = 'tutorial';
const SELF_ISOLATION_ID = 'selfIsolation';
const SCHOOL_HOLIDAYS_ID = 'schoolHolidays';
const WARM_WEATHER_ID = 'warmWeather';
const VACCINATION_CAMPAIGN_ID = 'vaccinationCampaign';
const VACCINATION_CAMPAIGN_PAID_ID = 'vaccinationCampaignPaid';

// Event trigger IDs
const SELF_ISOLATION_TRIGGER = 'selfIsolation';
const ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER = 'antivaxWithoutCampaignTrigger';
const ANTIVAX_WITH_CAMPAIGN_TRIGGER = 'antivaxWithCampaignTrigger';

const selfIsolationThreshold = 2000 / 7;

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
  return !isNil(triggerState) &&
    (triggerState.activeBefore === undefined
      || triggerState.trigger.reactivateAfter !== undefined
        && triggerState.activeBefore >= triggerState.trigger.reactivateAfter);
}

export interface EventData {
  aboveSelfIsolationThresholdDays: number;
  belowSelfIsolationThresholdDays: number;
  showAntivaxEvent: boolean;
  minStability: number;
}

export const initialEventData: EventData = {
  aboveSelfIsolationThresholdDays: 0,
  belowSelfIsolationThresholdDays: 0,
  showAntivaxEvent: false,
  minStability: 100,
};

/**
 * Callback that is called every day before trigger conditions are evaluated
 * @param eventInput - EventInput
 */
export function updateEventData(eventInput: EventInput) {
  const eventData = eventInput.eventData;

  // Used for self-isolation
  if (eventInput.stats.deaths.avg7Day >= selfIsolationThreshold) {
    eventData.aboveSelfIsolationThresholdDays++;
    eventData.belowSelfIsolationThresholdDays = 0;
  } else {
    eventData.aboveSelfIsolationThresholdDays = 0;
    eventData.belowSelfIsolationThresholdDays++;
  }

  // Antivax
  eventData.showAntivaxEvent = eventInput.date > '2021-01-10'
    // Both triggers need to be active in order not emit their events too soon one after another
    && isEventTriggerActive(eventInput, ANTIVAX_WITH_CAMPAIGN_TRIGGER)
    && isEventTriggerActive(eventInput, ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER)
    && probability(0.02);

  // Stability
  eventData.minStability = Math.min(eventInput.stats.stability, eventData.minStability);
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
        text: '<p>První případ nákazy Covidem-19 byl dnes potvrzen i v Česku. \
Na vás teď je, abyste na situaci zareagovali zavedením libovolných opatření nebo si se situací poradili jakkoliv jinak vám je libo. Barva jsou aktivní opatření, barva naopak značí, že opatření aktuálně není zavedeno. Každé opatření se projevuje na šíření koronaviru rozdílně. Pamatujte, že nějaká čas trvá, než se opatření na množství nakažených projeví. \
Každý panel má také v rohu otazník, který vám představí všechny své ovládací prvky.</p> \
<p>Hru můžete vždy pozastavit mezerníkem, nebo tlačítkem pauza.</p>',
        help: 'Při každé události ve hře si také můžete přečíst vzkazy od vašeho průvodce. Tyto texty budou vždy mít tuto barvu a snažíme se vám skrze ně poradit. Ale nemusíte se jimi nijak řídit!',
        choices: [
          simpleChoice('Chci přímo do hry'),
          simpleChoice('Ukažte mi ovládání', {id: TUTORIAL_ID, duration: Infinity}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.date === '2020-03-01',
  },
  {
    events: [
      {
        title: 'Grafy (hlavní panel)',
        text: '<p>Váš hlavní zdroj informací o aktuální situaci ve státě. Můžete si volit mezi zobrazením čtyř grafů:</p> \
<ul style="list-style-type: none">\
<li><strong>Ikonka viru</strong>: Počet nově nakažených</li>\
<li><strong>Ikonka lebky</strong>: Počet nově zemřelých</li>\
<li><strong>Ikonka peněz</strong>: Celkové náklady</li>\
<li><strong>Ikonka injekce</strong>: Počet imunních &ndash; součet vakcinovaných a imunních po prodělání nemoci</li>\
</ul>',
        help: 'Pokud nehledáte něco konkrétního (například postup očkování), doporučíme vám zůstat na zobrazení nově nakažených. To je pro zvládání pandemie ten nejpodstatnější graf.',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Základní statistiky (pod grafy)',
        text: 'Statistiky slouží jako rychlý přehled podstatných ukazatelů. V levé části panelu najdete čísla platná k aktuálnímu dni. Kromě opakování nakažených zde klíčovou roli hraje Kapacita nemocnic a Společenská stabilita. Pokud překročíte kapacitu nemocnic, bude nemoc výrazně nebezpečnější. Pokud budou vaše opatření příliš omezující nebo naopak zemře příliš lidí a společnost se úplně vystraší, může dojít k výměně vlády a vaše hra skončí. \
V pravém sloupci vidíte součty. Kolik lidí celkem je imunních, kolik již bylo ztraceno peněz a kolik osob pandemii podlehlo.',
        help: 'Propad stability na minimum je jediný způsob jak můžete před dostatečnou imunizací ukončit hru, dávejte si tedy na tento ukazatel obzvláštní pozor. Pokud bude příliš nízko, možná je čas uvolnit některá opatření.',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Opatření (panel s ovládacími prvky)',
        text: 'Zde naleznete váš hlavní nástroj k zvládání pandemie. Jednotlivá opatření a jejich naznačené dopady si můžete projít po kliknutí na otazníček v rohu panelu. Ve hře se také můžete rozhodnout některá opatření “kompenzovat” - znamená to, že budete vydávat zvláštní zdroje jako kompenzace poškozeným podnikům. \
Ve hře je pro zjednodušení stát nesmírně efektivní v zavádění a vypínání opatření. Vše je zavedeno okamžitě a vždy bez technických chyb. Toto je zásadní zjednodušení oproti reálnému světu.',
        help: 'Všechna opatření o něco snižují šíření viru, ale také stojí peníze a snižují stabilitu ve společnosti. Je samozřejmě na vás, jakou strategii zvládnutí viru zvolíte: snažili jsme se, aby náš model byl co nejférovější a umožnil různé přístupy. Můžete například zkusit nasazovat a zase vypínat opatření tak, abyste se vyhli vlnám a přetížení nemocnic.',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
  },
  {
    events: [
      {
        title: 'Efekty opatření',
        text: 'Poslední, zatím prázdný panel, vám bude ukazovat vliv všech voleb, které jste udělali v rámci různých krizových událostí. Událostí jsou ve hře desítky, ale při každé hře jich zažijete jen malou část.',
        help: 'A tím se ukončuje naše krátká cesta po ovládání hry. Jakmile zmáčknete OK, bude už jen na vás jak si s pandemií poradíte. Ale nebojte, ve všech mimořádných situacích se vám pokusíme nabídnout radu. \
Hodně štěstí!',
      },
    ],
    condition: (ei: EventInput) => isEventMitigationActive(ei, TUTORIAL_ID),
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
        title: 'Důvěra ve vládu opět stoupá',
        help: 'Podařilo se obnovit důvěru obyvatelstva. To nám dává prostor pro aktivnější užívání opatření.',
      },
    ],
    condition: (ei: EventInput) => ei.eventData.minStability <= 50 && ei.stats.stability >= 75,
  },
  {
    events: [
      {
        title: 'Důvěra ve vládu klesá',
        help: 'Důvěra lidí ve vládu klesá. Každé opatření má totiž náklady nejenom finanční, ale i ve stabilitě. Je tak nutné balancovat a zavírat jen když je to nutné. Opatření můžete vypínat a zapínat v panelu vpravo nahoře.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 75,
  },
  {
    events: [
      {
        title: 'Češi jsou z koronaviru frustrovaní',
        text: 'Nálada je stále horší, tvrdí terapeut.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 50,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá vládu k rezignaci a obyvatelstvo k opatrnosti!',
        help: 'Pozor, situace je velmi špatná. Pokud to tak půjde dál, přijdete o šanci zkusit pandemii zvládnout. Může být nutné uvolnit některá opatření v panelu vpravo nahoře nebo začít na stejném místě platit kompenzace.',
        // TODO effect on R?
        choices: okButton({name: 'Výzvy k rezignaci', duration: 90}),
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
        title: 'Analytici varují před rychlostí zadlužování země',
        help: 'Hra měří i to jak moc zadlužujete stát i kolik ztrácí jednotlivé podniky vlivem situace a různých opatření. Peníze si můžeme půjčovat, ale velmi vysoké výdaje mohou mít negativní vedlejší dopady.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 300_000_000_000,
  },
  {
    events: [
      {
        title: 'Výše státního dluhu je hrozivá, říkají analytici',
        help: 'Krize má vysoké náklady. V tuto chvíli nás pandemie stojí téměř přesně půlku celého státního rozpočtu České republiky v roce 2019.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 750_000_000_000,
  },
  {
    events: [
      {
        title: 'Státní dluh je nejvyšší v historii a dramaticky roste každou vteřinu!',
        help: 'Pouze výdaje spojené s pandemií koronaviru dosáhly součtu výdajů státního rozpočtu. Státní dluh a nezaměstnanost jsou rekordní, hodnota koruny rychle klesá.',
        choices: okButton({stabilityCost: 6}, 'Historický státní dluh'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.costs.total > 1_535_000_000_000,
  },
  {
    events: [
      {
        title: 'Hyper inflace a blížící se státní bankrot',
        help: 'Utrácíme o řád víc než bychom si mohli dovolit a běžná ekonomika je v troskách, řetězce vztahů mezi firmami přestávají fungovat. Ve společnosti je široká nespokojenost.',
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
        title: 'Za pouhý den COVID zabil {{stats.deaths.today}} lidí',
        help: 'Vypadá to, že to není pouhá chřipka. Je ke zvážení zapnout opatření, která mohou pomoci šíření viru zpomalit. Stejně tak ti, kteří nemoc přežijí, budou nějakou dobu imunní.',
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 10,
  },
  // pocet mrtvych za den: 100+
  {
    events: [
      {
        title: 'Česko má rekordní denní počet úmrtí lidí nakažených covidem',
        help: 'Stovka mrtvých denně zasévá do společnosti otázky, jestli vláda zvládá situaci dobře.',
        choices: okButton({stabilityCost: 2}, 'Rekordní denní úmrtí'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 100,
  },
  // pocet mrtvych za den: 750+
  {
    events: [
      {
        title: '{{stats.deaths.today}} mrtvých za den, kapacita krematorií lokálně překročena',
        help: 'Takto rychlé přibývání obětí poprvé obyvatelstvo šokuje. Časem si možná zvyknou, ale zrychlení na více obětí denně už by přijali jen velmi těžko.',
        choices: okButton({stabilityCost: 6}, 'Kapacita krematorií překročena'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.deaths.today >= 750,
  },
  // pocet mrtvych za den: 1500+
  {
    events: [
      {
        title: 'Temné predikce se naplnily: Česko přesáhlo hranici 1 500 mrtvých na koronavirus za den. Policie sváží mrtvé, armáda kope masové hroby.',
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
        title: 'Koronavirus v Česku usmrtil už přes 10 000 lidí.',
        help: 'Překonání hranice deseti tisíc mrtvých přináší nedůvěru ve vládu. Lidé se ale také nějakou dobu raději sami více hlídají. Ekonomická aktivita i šíření infekce na dva týdny klesá.',
        choices: [
          {
            buttonLabel: 'OK',
            mitigations: [
              {stabilityCost: 5},
              {rMult: 0.8, economicCost: 200_000_000, duration: 14},
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
        title: 'Další tragický milník: Česko překonalo hranici 100 000 zemřelých na covid',
        help: 'Sto tisíc mrtvých představuje světově tragické prvenství a bezprecedentní ztrátu životů. Tento milník lidi jak staví proti vládě, tak nutí k opatrnosti. Na dva týdny klesá ekonomická aktivita.',
        choices: [
          {
            buttonLabel: 'OK',
            mitigations: [
              {stabilityCost: 10},
              {rMult: 0.8, economicCost: 200_000_000, duration: 14},
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
        title: 'V centru Prahy dnes demonstrovali odpůrci koronavirových opatření. Neměli roušky, nedodržovali rozestupy',
        help: 'Zatknutí odpůrců může pobouřit část obyvatel a snížit tak společenskou stabilitu. Pokud však protesty proběhnou bez zásahu, přibude velké množství nakažených.',
        choices: [
          simpleChoice('Nechat protesty proběhnout', {rMult: 1.2, exposedDrift: 50, duration: 14}),
          simpleChoice('Pozatýkat', {stabilityCost: 2}),
        ],
      },
    ],
    condition: (ei: EventInput) => ei.stats.stability <= 40 && ei.stats.deaths.avg7Day < (500 / 7),
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
          id: SELF_ISOLATION_ID, rMult: 0.7, economicCost: 3.5 * 1.5 * 1_000_000_000,
          duration: Infinity,
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
        title: 'Začátek prázdnin',
        text: 'Školáci dostávají vysvědčení a začínají jim prázdniny.',
        help: 'Opatření “uzavření škol” bylo aktivováno bez dalších nákladů.',
        choices: okButton({name: 'Prázdniny', id: SCHOOL_HOLIDAYS_ID, duration: 62}, 'Začátek prázdnin'),
      },
    ],
    condition: (ei: EventInput) => dateBetween(ei.date, '2020-06-30', '2020-07-31'),
    reactivateAfter: 60,
  },
  {
    events: [
      {
        title: 'Konec prázdnin',
        text: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět vyžaduje další náklady a snižuje společenskou stabilitu.',
        choices: okButtonEndMitigation(SCHOOL_HOLIDAYS_ID, 'Konec prázdnin'),
      },
    ],
    condition: (ei: EventInput) => dateBetween(ei.date, '2020-09-01', '2020-09-30'),
    reactivateAfter: 60,
  },
  {
    events: [
      {
        title: 'Virus se v teplém podnebí hůř šíří. Vědci předpokládají zpomalení pandemie.',
        choices: okButton({name: 'Teplé počasí', id: WARM_WEATHER_ID, duration: 120}, 'Teplé počasí'),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-05-20', '2020-06-14')
      || dateBetween(ei.date, '2020-06-14', '2020-07-14'),
    reactivateAfter: 90,
  },
  {
    events: [
      {
        title: 'Konec teplého počasí',
        text: 'Jak teplota ovlivňuje šíření koronaviru? Chladné počasí počasí pomáhá šíření, tvrdí epidemiologové.',
        choices: okButtonEndMitigation(WARM_WEATHER_ID, 'Konec teplého počasí'),
      },
    ],
    condition: (ei: EventInput) => randomDateBetweenTrigger(ei.date, '2020-09-10', '2020-10-09')
      || dateBetween(ei.date, '2020-10-09', '2020-11-09'),
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
          simpleChoice('Povolit mše', {stabilityCost: -2, exposedDrift: random(500, 1500)}),
          simpleChoice('Povolit rodinná setkání nad 6 lidí', {stabilityCost: -2,
            exposedDrift: random(1000, 2000)}),
          simpleChoice('Povolit obojí', {stabilityCost: -5, exposedDrift: random(1500, 4000)}),
          simpleChoice('Zakázat mše i rodinná setkání', {stabilityCost: 5}),
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
            buttonLabel: 'Investovat do propagace vakcín',
            mitigations: [
              {id: VACCINATION_CAMPAIGN_ID, name: 'Vakcinační kampaň',
                vaccinationPerDay: 0.0001, duration: Infinity},
              {id: VACCINATION_CAMPAIGN_PAID_ID, economicCost: 1_000_000_000},
            ],
          },
          simpleChoice('Neinvestovat', {vaccinationPerDay: -0.0001, duration: Infinity}),
        ],
      },
    ],
    // TODO timing randomization
    condition: (ei: EventInput) => ei.date >= '2021-01-01',
    reactivateAfter: 90,
  },
  {
    events: [
      {
        title: 'Vládní kampaň odrazuje občany',
        text: 'Mysleli jsme to dobře, ale dopadlo to...nedobře.',
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
        help: 'Rychlost vakcinace se snižuje.',
        choices: okButton({vaccinationPerDay: -0.0002, duration: Infinity}),
      }),
    ),
    id: ANTIVAX_WITHOUT_CAMPAIGN_TRIGGER,
    condition: (ei: EventInput) =>
      (ei.eventData.showAntivaxEvent && !isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID)),
    reactivateAfter: 7, // cannot occur more often than once every 7 days
  },
  {
    events: antivaxEventTexts.map(et =>
      ({
        title: et.title,
        text: et.text,
        help: 'Očkovací kampaň přestala fungovat.',
        choices: [
          {buttonLabel: 'OK', removeMitigationIds: [VACCINATION_CAMPAIGN_ID]},
        ],
      }),
    ),
    id: ANTIVAX_WITH_CAMPAIGN_TRIGGER,
    condition: (ei: EventInput) =>
      (ei.eventData.showAntivaxEvent && isEventMitigationActive(ei, VACCINATION_CAMPAIGN_ID)),
    reactivateAfter: 7, // cannot occur more often than once every 7 days
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
        choices: okButton(undefined, '1/2 očkována'),
      },
    ],
    condition: (ei: EventInput) => ei.stats.vaccinationRate > .5,
  },
];
