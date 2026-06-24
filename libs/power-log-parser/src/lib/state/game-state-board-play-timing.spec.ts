import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { FullEntity } from '../models/entity';
import { GameState } from './game-state';

function minionOnBoard(id: number, zonePosition: number, boardPlayTiming: number): FullEntity {
	const entity = new FullEntity();
	entity.Id = id;
	entity.CardId = `MINION_${id}`;
	entity.BoardPlayTiming = boardPlayTiming;
	entity.SetTag(GameTag.ZONE, Zone.PLAY as number);
	entity.SetTag(GameTag.CARDTYPE, CardType.MINION as number);
	entity.SetTag(GameTag.ZONE_POSITION, zonePosition);
	return entity;
}

describe('GameState board play timing', () => {
	it('assigns increasing BoardPlayTiming when a minion enters PLAY', () => {
		const gameState = new GameState();
		const entity = new FullEntity();
		entity.Id = 10;
		entity.SetTag(GameTag.ZONE, Zone.HAND as number);
		entity.SetTag(GameTag.CARDTYPE, CardType.MINION as number);
		gameState.CurrentEntities.set(10, entity);

		const tagChange = {
			Entity: 10,
			Name: GameTag.ZONE as number,
			Value: Zone.PLAY as number,
		};
		gameState.TagChange(tagChange as any, '');

		expect(entity.BoardPlayTiming).toBe(1);

		const second = new FullEntity();
		second.Id = 11;
		second.SetTag(GameTag.ZONE, Zone.SETASIDE as number);
		second.SetTag(GameTag.CARDTYPE, CardType.MINION as number);
		gameState.CurrentEntities.set(11, second);
		gameState.TagChange(
			{ Entity: 11, Name: GameTag.ZONE as number, Value: Zone.PLAY as number } as any,
			'',
		);

		expect(second.BoardPlayTiming).toBe(2);
	});

	it('reassigns BoardPlayTiming when a minion returns to PLAY from graveyard', () => {
		const gameState = new GameState();
		const entity = new FullEntity();
		entity.Id = 20;
		entity.SetTag(GameTag.ZONE, Zone.HAND as number);
		entity.SetTag(GameTag.CARDTYPE, CardType.MINION as number);
		gameState.CurrentEntities.set(20, entity);

		gameState.TagChange(
			{ Entity: 20, Name: GameTag.ZONE as number, Value: Zone.PLAY as number } as any,
			'',
		);
		gameState.TagChange(
			{ Entity: 20, Name: GameTag.ZONE as number, Value: Zone.GRAVEYARD as number } as any,
			'',
		);
		gameState.TagChange(
			{ Entity: 20, Name: GameTag.ZONE as number, Value: Zone.PLAY as number } as any,
			'',
		);

		expect(entity.BoardPlayTiming).toBe(2);
	});

	it('does not assign BoardPlayTiming for spells entering PLAY', () => {
		const gameState = new GameState();
		const entity = new FullEntity();
		entity.Id = 30;
		entity.SetTag(GameTag.ZONE, Zone.HAND as number);
		entity.SetTag(GameTag.CARDTYPE, CardType.SPELL as number);
		gameState.CurrentEntities.set(30, entity);

		gameState.TagChange(
			{ Entity: 30, Name: GameTag.ZONE as number, Value: Zone.PLAY as number } as any,
			'',
		);

		expect(entity.BoardPlayTiming).toBe(0);
		expect(gameState.NextBoardPlayTiming).toBe(0);
	});

	it('SortMinionsByBoardPlayOrder sorts by play order, not zone position', () => {
		const minions = [
			minionOnBoard(1, 1, 3),
			minionOnBoard(2, 3, 1),
			minionOnBoard(3, 2, 2),
		];

		const sorted = GameState.SortMinionsByBoardPlayOrder(minions);

		expect(sorted.map((m) => m.Id)).toEqual([2, 3, 1]);
	});

	it('SortMinionsByBoardPlayOrder falls back to zone position when timing is tied', () => {
		const minions = [minionOnBoard(1, 2, 1), minionOnBoard(2, 1, 1)];

		const sorted = GameState.SortMinionsByBoardPlayOrder(minions);

		expect(sorted.map((m) => m.Id)).toEqual([2, 1]);
	});
});
