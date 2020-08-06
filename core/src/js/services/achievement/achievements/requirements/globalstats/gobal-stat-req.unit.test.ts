import { GlobalStat } from '@firestone-hs/build-global-stats/dist/model/global-stat';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { GlobalStatReq } from './global-stat-req';

describe('global-stat-req', () => {
	test('is completed when key is total-damage-to-enemy-hero, value is exactly target and context is correct', () => {
		const req = new GlobalStatReq('total-damage-to-enemy-hero', 'global', 500);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GLOBAL_STATS_UPDATED,
			additionalData: {
				stats: {
					stats: [
						{
							statKey: 'total-damage-to-enemy-hero',
							statContext: 'global',
							value: 500,
						} as GlobalStat,
					],
				} as GlobalStats,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when key is total-damage-to-enemy-hero, value is greater than target and context is correct', () => {
		const req = new GlobalStatReq('total-damage-to-enemy-hero', 'global', 500);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GLOBAL_STATS_UPDATED,
			additionalData: {
				stats: {
					stats: [
						{
							statKey: 'total-damage-to-enemy-hero',
							statContext: 'global',
							value: 1200,
						} as GlobalStat,
					],
				} as GlobalStats,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when key is total-damage-to-enemy-hero, value is lower than target and context is correct', () => {
		const req = new GlobalStatReq('total-damage-to-enemy-hero', 'global', 500);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GLOBAL_STATS_UPDATED,
			additionalData: {
				stats: {
					stats: [
						{
							statKey: 'total-damage-to-enemy-hero',
							statContext: 'global',
							value: 200,
						} as GlobalStat,
					],
				} as GlobalStats,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when key is total-damage-to-enemy-hero, value is exactly target and context is not correct', () => {
		const req = new GlobalStatReq('total-damage-to-enemy-hero', 'global', 500);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GLOBAL_STATS_UPDATED,
			additionalData: {
				stats: {
					stats: [
						{
							statKey: 'total-damage-to-enemy-hero',
							statContext: 'adventure',
							value: 500,
						} as GlobalStat,
					],
				} as GlobalStats,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when key is something else, value is exactly target and context is correct', () => {
		const req = new GlobalStatReq('total-damage-to-enemy-hero', 'global', 500);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GLOBAL_STATS_UPDATED,
			additionalData: {
				stats: {
					stats: [
						({
							statKey: 'total-damage-to-enemy-hero-2',
							statContext: 'adventure',
							value: 500,
						} as unknown) as GlobalStat,
					],
				} as GlobalStats,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'GLOBAL_STAT',
			'values': ['total-damage-to-enemy-hero', 'global', '500'],
		};

		const req = GlobalStatReq.create(rawReq);

		expect(req['targetContext']).toBe('global');
		expect(req['targetKey']).toBe('total-damage-to-enemy-hero');
		expect(req['targetValue']).toBe(500);
	});
});
