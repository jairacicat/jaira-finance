import type { Settings } from '../types';

export function fmtMoney(n: number, s: Pick<Settings, 'currency' | 'locale'>) {
  try {
    return new Intl.NumberFormat(s.locale, {
      style: 'currency',
      currency: s.currency,
      maximumFractionDigits: 2
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function uid(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `${prefix}${t}${r}`;
}

export function ymd(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function addInterval(date: string, cadence: 'daily' | 'weekly' | 'monthly', interval: number): string {
  const d = new Date(date + 'T00:00:00');
  if (cadence === 'daily') d.setDate(d.getDate() + interval);
  if (cadence === 'weekly') d.setDate(d.getDate() + interval * 7);
  if (cadence === 'monthly') d.setMonth(d.getMonth() + interval);
  return ymd(d);
}
