/* eslint-disable @typescript-eslint/no-use-before-define */
import 'jest-extended';
import { gameStateBuilder } from '../../final-game-state-builder';
import pluginEventsFullGame from './plugin-events-full-game.json';

describe('Battlegrounds Board state', () => {
	test('Cards on board are correct', async () => {
		const gameState = await gameStateBuilder(pluginEventsFullGame, null);

		expect(gameState.playerDeck.board.map(card => card.entityId)).toEqual([
			4659,
			4661,
			4662,
			4665,
			4666,
			4667,
			4668,
		]);
		expect(gameState.opponentDeck.board.map(card => card.entityId)).toEqual([5192, 5193, 5194, 5195, 5196]);
	}, 20000);
});
