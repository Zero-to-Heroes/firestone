/**
 * Identity Theft (REV_253): "Discover a copy of a card from your opponent's hand and deck."
 * Green Aspect Essence (CATA_EVENT_110t6): "Summon an 8/8 Dragon. Cast every adjoining Aspect Essence."
 *
 * Regression: Identity Theft reveals that opponent entity 80 is Green Aspect Essence while that entity
 * is already in hand. The tracker should keep one known-in-hand representation and consume the matching virtual
 * Dragon Soul deck row instead of showing the same physical card in both zones.
 *
 * Run:
 *   npm exec nx test game-state -- --testPathPatterns=power-log-identity-theft-essence-replay --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const GREEN_ASPECT = CardIds.DragonSoulShattered_GreenAspectEssenceToken_CATA_EVENT_110t6;
const OPPONENT_PLAYER_ID = 2;
const SOURCE_HAND_ENTITY_ID = 80;

describe('Power log replay → GameStateService (Identity Theft Green Aspect zone duplication)', () => {
	it('grounds the Identity Theft hand reveal in the fixture', () => {
		const logPath = resolvePowerLogPathForSlug('identity-theft-essence');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');

		const sourceDrawIndex = raw.search(/id=80 zone=DECK[^\n]*tag=ZONE value=HAND/);
		const identityTheftPlayIndex = raw.search(
			/BLOCK_START BlockType=PLAY Entity=\[entityName=Identity Theft id=24[^\n]*cardId=REV_253 player=1\]/,
		);
		const copiedFromIndex = raw.search(
			/Green Aspect Essence id=109[^\n]*cardId=CATA_EVENT_110t6[^\n]*tag=COPIED_FROM_ENTITY_ID value=80/,
		);
		const linkedEntityIndex = raw.search(
			/Green Aspect Essence id=109[^\n]*cardId=CATA_EVENT_110t6[^\n]*tag=LINKED_ENTITY value=80/,
		);

		expect(sourceDrawIndex).toBeGreaterThanOrEqual(0);
		expect(identityTheftPlayIndex).toBeGreaterThan(sourceDrawIndex);
		expect(copiedFromIndex).toBeGreaterThan(identityTheftPlayIndex);
		expect(linkedEntityIndex).toBeGreaterThan(copiedFromIndex);
		expect(raw).toContain(
			'm_chosenEntities[0]=[entityName=Habeas Corpses id=108 zone=SETASIDE zonePos=0 cardId=MAW_002 player=1]',
		);
	});

	it('keeps the revealed Green Aspect only in opponent hand knowledge, not in deck', async () => {
		const logPath = resolvePowerLogPathForSlug('identity-theft-essence');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'identity-theft-essence-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(OPPONENT_PLAYER_ID);
			const opponentDeck = ctx.state.opponentDeck;
			const sourceHandCard = opponentDeck.hand.find(
				(card) => (card.entityId ?? card.trueEntityId) === SOURCE_HAND_ENTITY_ID,
			);
			expect(sourceHandCard).toBeDefined();

			const knownInHand =
				opponentDeck.hand.filter((card) => card.cardId === GREEN_ASPECT).length +
				opponentDeck.additionalKnownCardsInHand.filter((cardId) => cardId === GREEN_ASPECT).length;
			const knownInDeck =
				opponentDeck.deck.filter((card) => card.cardId === GREEN_ASPECT).length +
				opponentDeck.additionalKnownCardsInDeck.filter((cardId) => cardId === GREEN_ASPECT).length;

			expect(knownInDeck).toBe(0);
			expect(knownInHand).toBe(1);
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
