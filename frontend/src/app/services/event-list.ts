export interface Event {
  title: string;
  text: string;
  options: { label: string }[];
}

export const eventList = [
  {
    title: 'Smutný rekord: {{deathsToday}} mrtvých za jediný den',
    text: 'Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...',
  },
  {
    title: 'Šok: {{deathsToday}} mrtvých za jediný den',
    text: 'Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.',
  }
];
