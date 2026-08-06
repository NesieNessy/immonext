import { describe, expect, it } from 'vitest';
import { runRentCalculator, type CalculatorParams } from './rentCalculator';
import type { RenovationCase } from './renovation';
import fixture from './__fixtures__/realWorkflowSnapshot.json';
import expected from './__fixtures__/realWorkflowSnapshot.expected.json';

/**
 * Golden-snapshot regression test using a real captured workflow — not a
 * constructed one. `realWorkflowSnapshot.json` is the exact `params` and
 * `renovationCases` the calculator API route sent to a browser during manual
 * testing; `realWorkflowSnapshot.expected.json` is `runRentCalculator`'s
 * output for that input, frozen at the time this test was written.
 *
 * This exists specifically to guard the upcoming move of normalization logic
 * (normalizeTaxRate, normalizeRecentMonth, the interval/interest clamps, the
 * rent-index fallback) out of the API route and into this library, and the
 * later move of the calculation itself into the browser. Both changes must
 * leave `runRentCalculator`'s behavior on this real input untouched — if a
 * refactor changes so much as one rounding step, this test fails with an
 * exact diff instead of the drift being discovered later as "the numbers
 * don't match what was saved before."
 *
 * To intentionally update after a verified behavior change: re-run the freeze
 * script that generated `.expected.json` (see git history of this file) and
 * review the diff like any other reviewed change — never hand-edit the
 * expected file.
 */
describe('runRentCalculator — parity against a real captured workflow', () => {
  const params = fixture.params as unknown as CalculatorParams;
  const cases = fixture.renovationCases as unknown as RenovationCase[];
  const result = runRentCalculator(params, cases);

  it('reproduces the §558 plan (conservative and market-rent-index variants)', () => {
    expect(result.increases558).toEqual(expected.increases558);
    expect(result.increases558WithRentIndex).toEqual(expected.increases558WithRentIndex);
  });

  it('reproduces the §559 modernization plan', () => {
    expect(result.modernizationPlan).toEqual(expected.modernizationPlan);
  });

  it('reproduces the summary metrics and break-even points', () => {
    expect(result.metrics).toEqual(expected.metrics);
    expect(result.breakEven).toBe(expected.breakEven);
    expect(result.breakEvenWithRentIndex).toBe(expected.breakEvenWithRentIndex);
  });

  it('reproduces the Kappungsgrenze parameters', () => {
    expect(result.capAbs).toBe(expected.capAbs);
    expect(result.capPercent).toBe(expected.capPercent);
    expect(result.capPerM2).toBe(expected.capPerM2);
    expect(result.denseMarket).toBe(expected.denseMarket);
  });

  it('reproduces the timeline shape and its boundary rows', () => {
    expect(result.timeline).toHaveLength(expected.timelineLength);
    expect(result.timeline[0]).toEqual(expected.timelineFirstRow);
    expect(result.timeline[result.timeline.length - 1]).toEqual(expected.timelineLastRow);
  });

  it('is stable across repeated runs on the same input (a prerequisite for any client/server parity claim)', () => {
    const again = runRentCalculator(params, cases);
    expect(again).toEqual(result);
  });
});
