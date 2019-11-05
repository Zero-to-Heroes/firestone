/* eslint-disable @typescript-eslint/no-use-before-define */
import 'jest-extended';
import { gameStateBuilder } from '../final-game-state-builder';
import pluginEventsBeneathTheGround from './plugin-events-beneath-the-ground.json';
import pluginEventsGangUp from './plugin-events-gang-up.json';
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

	test('cards created by Gang Up in the players deck show in player deck and not in opponents hand', async () => {
		const gameState = await gameStateBuilder(pluginEventsGangUp, null);

		expect(gameState.opponentDeck.hand.map(card => card.entityId)).toEqual([55, 52, 61, 39]);
		expect(gameState.opponentDeck.deck.length).toBe(0);
		expect(gameState.playerDeck.deck.map(card => card.cardId).filter(cardId => cardId)).toEqual([
			'ULD_186',
			'EX1_144',
			'GIL_696',
			'GVG_055',
			'EX1_506',
		]);
	});

	test('cards created by Gang Up in the players deck show in player deck when decklist is provided', async () => {
		const gameState = await gameStateBuilder(pluginEventsGangUp, {
			deckstring: 'AAEBAaIHCt0IzhXcrwKBwgLrwgLc0QLR4QKo9wKomAOImwMK7QKAEpsUkrYC+MECt/UC4PoCr5ED9acDragDAA==',
		});

		expect(gameState.opponentDeck.hand.map(card => card.entityId)).toEqual([55, 52, 61, 39]);
		expect(gameState.opponentDeck.deck.length).toBe(0);
		expect(gameState.playerDeck.deck.map(card => card.cardId).filter(cardId => cardId)).toIncludeSameMembers([
			'KAR_069',
			'KAR_069',
			'UNG_809',
			'DAL_010',
			'DAL_010',
			'ULD_186',
			'BRM_007',
			'UNG_058',
			'UNG_058',
			'GIL_696',
			'BOT_288',
			'BOT_288',
			'ULD_328',
			'EX1_134',
			'AT_035',
			'AT_035',
			'BOT_087',
			'OG_291',
			'UNG_064',
			'LOOT_167',
			'DAL_719',
			'ULD_186',
			'EX1_144',
			'GIL_696',
			'GVG_055',
			'EX1_506',
		]);
	});

	test('cards created by Beneath the Ground in the opponents deck show in deck and not in hand', async () => {
		const gameState = await gameStateBuilder(pluginEventsBeneathTheGround, null);

		expect(gameState.opponentDeck.hand.map(card => card.entityId)).toEqual([47, 61, 35, 36, 62]);
		expect(gameState.opponentDeck.deck.map(card => card.entityId).filter(cardId => cardId)).toEqual([80, 81, 82]);
		expect(gameState.playerDeck.deck.length).toBe(0);
	});
});
