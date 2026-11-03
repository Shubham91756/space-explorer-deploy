import { getMoonPhase } from './utils/getMoonPhase';
import { isSpaceEvent } from './utils/classifyEvent';

describe('moon phase calculation', () => {
  test('recognizes the last quarter on 2026-11-02', () => {
    expect(getMoonPhase(new Date('2026-11-02T00:00:00Z'))).toContain('Last Quarter');
  });
});

describe('space event classifier', () => {
  test('accepts explicit space terms and rejects incidental planet words', () => {
    expect(isSpaceEvent('NASA launches a telescope')).toBe(true);
    expect(isSpaceEvent('The earth shook beneath the city')).toBe(false);
    expect(isSpaceEvent('Mars rover lands')).toBe(true);
  });
});
