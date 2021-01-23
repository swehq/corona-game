export type EventsLevel = false | 1000 | 100 | 10;
export type BusinessesLevel = false | 'some' | 'most';
export type SchoolsLevel = false | 'universities' | 'all';

export interface Mitigations {
  bordersClosed: boolean;
  businesses: BusinessesLevel;
  events: EventsLevel;
  rrr: boolean;
  schools: SchoolsLevel;
  stayHome: boolean;
  compensations: boolean;
}

export const defaultMitigations: Mitigations = {
  bordersClosed: false,
  businesses: false,
  events: false,
  rrr: false,
  schools: false,
  stayHome: false,
  compensations: false,
};
