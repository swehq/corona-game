import {addDays, differenceInDays, format} from 'date-fns';

export function nextDay(day: string): string {
  // works internally with local time (TZ-resistant)
  const date = addDays(new Date(`${day} 00:00`), 1);
  return format(date, 'yyyy-MM-dd');
}

// Create a function sampling from a normal distribution
export function normalSampler(mean: number, variance: number) {
  return () => randn() * variance + mean;
}

// Create a function sampling positive values from a normal distribution
export function normalPositiveSampler(mean: number, variance: number) {
  const sample = normalSampler(mean, variance);
  return () => {
    let x = sample();
    while (x <= 0) x = sample();

    return x;
  };
}

function randn() {
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Returns seasonal stage of the year in the interval [0, .5]
 * @param date actual date
 * @param peak date of the season
 */
export function getSeasonality(date: string, peak: string) {
  const tropicalYearLength = 365.2422;
  const daysDistance = Math.abs(differenceInDays(new Date(`${date} 00:00`), new Date(`${peak} 00:00`)));
  const seasonalityPhase = (daysDistance / tropicalYearLength) % 1;

  return seasonalityPhase > .5 ? 1 - seasonalityPhase : seasonalityPhase;
}
