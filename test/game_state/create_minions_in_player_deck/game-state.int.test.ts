/* eslint-disable @typescript-eslint/no-use-before-define */
import { gameStateBuilder } from '../final-game-state-builder';
import pluginEventsBeneathTheGround from './plugin-events-beneath-the-ground.json';
import pluginEventsLabRecruiter from './plugin-events-lab-recruiter.json';

describe('Cards created in the players deck', () => {
	test('cards created by Lab Recruiter in the players deck show in player deck and not in opponents hand', async () => {
		const gameState = await gameStateBuilder(pluginEventsLabRecruiter, null);

		expect(gameState.opponentDeck.hand.map(card => card.entityId)).toEqual([39, 61, 55, 36]);
		expect(gameState.opponentDeck.deck.length).toBe(0);
		expect(gameState.playerDeck.deck.map(card => card.cardId).filter(cardId => cardId)).toEqual([
			'EX1_134', // from mulligan
			'UNG_057t1', // from razorpetal
			'BOT_288',
			'BOT_288',
			'BOT_288',
		]);
	});

	test('cards created by Beneath the Ground in the opponents deck show in deck and not in hand', async () => {
		const gameState = await gameStateBuilder(pluginEventsBeneathTheGround, null);

		expect(gameState.opponentDeck.hand.map(card => card.entityId)).toEqual([47, 61, 35, 36, 62]);
		expect(gameState.opponentDeck.deck.map(card => card.entityId).filter(cardId => cardId)).toEqual([80, 81, 82]);
		expect(gameState.playerDeck.deck.length).toBe(0);
	});
});
