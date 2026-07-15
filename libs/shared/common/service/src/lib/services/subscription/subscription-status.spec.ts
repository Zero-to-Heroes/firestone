import { CurrentPlan } from '@firestone/shared/framework/core';
import { resolveNewPlan, SUB_STATUS_ERROR } from './subscription-status';

describe('resolveNewPlan', () => {
	const legacyPlan: CurrentPlan = {
		id: 'legacy',
		expireAt: new Date('2026-07-23T00:35:59.000Z'),
		active: true,
		autoRenews: true,
		cancelled: false,
	};

	// Regression test: a 502 on the subscription status endpoint used to be treated as
	// "no subscription", flipping legitimate premium users back to free (and showing ads)
	it('keeps the last-known plan when the status fetch errors out', () => {
		const result = resolveNewPlan(SUB_STATUS_ERROR, legacyPlan);
		expect(result.plan).toBe(legacyPlan);
		expect(result.shouldUpdate).toBe(false);
	});

	it('keeps a null plan on fetch error for free users', () => {
		const result = resolveNewPlan(SUB_STATUS_ERROR, null);
		expect(result.plan).toBeNull();
		expect(result.shouldUpdate).toBe(false);
	});

	it('grants premium when the legacy provider returns an ow-confirmed plan and none was cached', () => {
		const owConfirmedPlan: CurrentPlan = {
			id: 'legacy',
			expireAt: new Date('2026-07-23T00:35:59.000Z'),
			active: true,
			autoRenews: true,
			cancelled: false,
		};
		const result = resolveNewPlan(owConfirmedPlan, null);
		expect(result.plan).toBe(owConfirmedPlan);
		expect(result.shouldUpdate).toBe(true);
	});

	it('clears the plan when the server definitively answers "no subscription"', () => {
		const result = resolveNewPlan(null, legacyPlan);
		expect(result.plan).toBeNull();
		expect(result.shouldUpdate).toBe(true);
	});

	it('does not signal an update when the fetched plan matches the existing one', () => {
		const result = resolveNewPlan({ ...legacyPlan }, legacyPlan);
		expect(result.plan).toBe(legacyPlan);
		expect(result.shouldUpdate).toBe(false);
	});

	it('updates to the fetched plan when it differs from the existing one', () => {
		const newPlan: CurrentPlan = {
			id: 'premium',
			expireAt: null,
			active: true,
			autoRenews: true,
			cancelled: false,
		};
		const result = resolveNewPlan(newPlan, legacyPlan);
		expect(result.plan).toBe(newPlan);
		expect(result.shouldUpdate).toBe(true);
	});
});
