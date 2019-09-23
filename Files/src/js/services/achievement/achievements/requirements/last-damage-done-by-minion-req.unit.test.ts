import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { LastDamageDoneByMinionReq } from './last-damage-done-by-minion-req';

describe('last-damage-done-by-minion-req', () => {
	test('is completed when last damage dealt to opponent is done by the right minion', () => {
		const req = new LastDamageDoneByMinionReq('ULDA_026');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			opponentPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				sourceCardId: 'ULDA_026',
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when other minion does damage', () => {
		const req = new LastDamageDoneByMinionReq('ULDA_026');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			opponentPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				sourceCardId: 'other',
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when other minion does damage after the correct minion', () => {
		const req = new LastDamageDoneByMinionReq('ULDA_026');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			opponentPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				sourceCardId: 'ULDA_026',
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);
		const other = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			opponentPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				sourceCardId: 'other',
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);
		req.test(other);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when minion does damage to the player', () => {
		const req = new LastDamageDoneByMinionReq('ULDA_026');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			opponentPlayer: { PlayerId: 3, CardID: 'HERO_07' },
			additionalData: {
				sourceCardId: 'ULDA_026',
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target damage', () => {
		const rawReq: RawRequirement = {
			'type': 'LAST_DAMAGE_DONE_BY_MINION',
			'values': ['ULDA_026'],
		};

		const req = LastDamageDoneByMinionReq.create(rawReq);

		expect(req['targetSourceMinion']).toBe('ULDA_026');
	});
});
