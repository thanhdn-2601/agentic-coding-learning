export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
  isConfigured: boolean;
}

export function getTimeRemaining(targetISO: string | undefined): TimeRemaining {
  if (!targetISO) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false, isConfigured: false };
  }

  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const total = Number.isNaN(target) ? 0 : Math.max(0, target - now);

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    isOver: total === 0,
    isConfigured: true,
  };
}
