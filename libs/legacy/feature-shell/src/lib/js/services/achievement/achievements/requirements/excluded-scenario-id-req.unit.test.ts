import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { ExcludedScenarioIdReq } from './excluded-scenario-id-req';

describe('excluded-scenario-id-req', () => {
	test('is completed when event does not have one of the excluded scenario ids', () => {
		const req = new ExcludedScenarioIdReq([1, 2, 3]);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: {
				metaData: {
					ScenarioID: 4,
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when event has one of the excluded scenario ids', () => {
		const req = new ExcludedScenarioIdReq([1, 2, 3]);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: {
				metaData: {
					ScenarioID: 2,
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is completed if the excluded list is empty', () => {
		const req = new ExcludedScenarioIdReq([]);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: {
				metaData: {
					ScenarioID: 2,
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed if no event is emitted', () => {
		const req = new ExcludedScenarioIdReq([]);
		expect(req.isCompleted()).toBe(true);
	});
});

test('req is intantiated with the correct format type', () => {
	const rawReq: RawRequirement = {
		'type': 'EXCLUDED_SCENARIO_IDS',
		'values': ['2', '3'],
	};

	const req = ExcludedScenarioIdReq.create(rawReq);

	expect(req['excludedScenarioIds']).toEqual([2, 3]);
});
