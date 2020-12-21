import {DayState} from './simulation';

export interface Event {
  title: string;
  text: string;
  condition?: (stats: DayState) => boolean;
}

// no type check below for interpolated attributes
// TODO use rounded values
export const eventList: Event[] = [
  {
    title: '{{deathsToday}} mrtvých za jediný den',
    text: 'Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...',
    condition: (s: DayState) => s.deathsToday > 10,
  },
  {
    title: 'Šok: {{deathsToday}} mrtvých za jediný den',
    text: 'Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.',
    condition: (s: DayState) => s.deathsToday > 100,
  },
  {
    title: 'Ekonomika: První miliarda v nákladech!',
    // TODO show in billion
    text: 'Konkrétně {{stats.costTotal}} a to máme za sebou již {{infected}} infikovaných',
    condition: (s: DayState) => s.stats.costTotal > 1_000_000_000,
  },
  {
    title: 'Úspěšně očkujeme',
    text: 'Polovina populace již byla očkována.',
    condition: (s: DayState) => s.vaccinationRate > .5,
  },
];
