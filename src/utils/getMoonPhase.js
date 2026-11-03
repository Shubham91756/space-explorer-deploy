const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export function getMoonPhase(date) {
  const elapsedDays = (date.getTime() - REFERENCE_NEW_MOON) / 86400000;
  const phase = ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const index = Math.floor((phase / SYNODIC_MONTH_DAYS) * 8 + 0.5) % 8;
  return [
    '🌑 New Moon',
    '🌒 Waxing Crescent',
    '🌓 First Quarter',
    '🌔 Waxing Gibbous',
    '🌕 Full Moon',
    '🌖 Waning Gibbous',
    '🌗 Last Quarter',
    '🌘 Waning Crescent',
  ][index];
}
