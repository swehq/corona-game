import {addDays} from 'date-fns';
import {utcToZonedTime, format} from 'date-fns-tz';

export function nextDay(day: string): string {
  // Keep date arithmetic explicitly in UTC
  const date = addDays(utcToZonedTime(day, 'UTC'), 1);
  return format(date, 'yyyy-MM-dd', {timeZone: 'UTC'});
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

  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
