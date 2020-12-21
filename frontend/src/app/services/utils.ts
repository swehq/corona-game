import {addDays, format} from 'date-fns';

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

  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
