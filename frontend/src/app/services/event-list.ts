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
    title: '{{stats.deaths.today}} mrtvých za jediný den',
    text: 'Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...',
    condition: (s: DayState) => s.stats.deaths.today >= 10,
  },
  {
    title: 'Šok: {{stats.deaths.today}} mrtvých za jediný den',
    text: 'Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.',
    condition: (s: DayState) => s.stats.deaths.today >= 100,
  },
  {
    title: 'Ekonomika: První miliarda v nákladech!',
    // TODO show in billion
    text: 'Konkrétně {{stats.costTotal}} a to máme za sebou již {{stats.detectedInfections.today}} infikovaných',
    condition: (s: DayState) => s.stats.costTotal > 1_000_000_000,
  },
  {
    title: 'Úspěšně očkujeme',
    text: 'Polovina populace již byla očkována.',
    condition: (s: DayState) => s.stats.vaccinationRate > .5,
  },
];
