import { buildLegacyPlanFromOwDetailedPlan } from './ow-legacy-plan.mapper';

describe('buildLegacyPlanFromOwDetailedPlan', () => {
	it('maps an active Overwolf legacy plan', () => {
		const result = buildLegacyPlanFromOwDetailedPlan({
			planId: 13,
			state: 'active',
			expiryDate: '2026-07-23T00:35:59.000Z',
		});
		expect(result).toEqual({
			id: 'legacy',
			expireAt: new Date('2026-07-23T00:35:59.000Z'),
			active: true,
			autoRenews: true,
			cancelled: false,
		});
	});

	it('maps a cancelled but not yet expired Overwolf legacy plan', () => {
		const result = buildLegacyPlanFromOwDetailedPlan({
			planId: 13,
			state: 'cancelled',
			expiryDate: Date.now() + 60_000,
		});
		expect(result).toEqual({
			id: 'legacy',
			expireAt: new Date(Date.now() + 60_000),
			active: true,
			autoRenews: false,
			cancelled: true,
		});
	});

	it('returns null for a revoked plan', () => {
		expect(
			buildLegacyPlanFromOwDetailedPlan({
				planId: 13,
				state: 'revoked',
				expiryDate: Date.now() + 60_000,
			}),
		).toBeNull();
	});

	it('returns null for an expired cancelled plan', () => {
		expect(
			buildLegacyPlanFromOwDetailedPlan({
				planId: 13,
				state: 'cancelled',
				expiryDate: Date.now() - 60_000,
			}),
		).toBeNull();
	});
});
