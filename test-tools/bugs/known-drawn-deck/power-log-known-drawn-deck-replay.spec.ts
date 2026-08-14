/**
 * Identity Theft (REV_253): "Discover a copy of a card from your opponent's hand and deck."
 * Wicked Blightspawn (END_002): "Reborn. Deathrattle: Equip a 1/2 Dagger..."
 * Keymaster Alabaster (CORE_SCH_717): "Whenever your opponent draws a card, add a copy to your hand."
 *
 * Regression: Identity Theft reveals opponent deck entity 18 as Wicked Blightspawn. That entity is
 * later drawn (hidden DECK→HAND) and Keymaster copies it, so we know it left the deck. Remaining
 * deck must not still list END_002. Overlay at this cutoff still shows END_002 in the DK remaining
 * deck, the DK hand, and the Priest hand (1-cost Keymaster copy).
 *
 * Fixture: Chmielinho#2928 (player 2, Priest) vs youzeqq#2689 (player 1, DK). Truncated after
 * Keymaster copies entity 18 (PowerTaskList 634 ends), before the DK plays Fading Memory.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/known-drawn-deck/power-log-known-drawn-deck-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '@firestone/game-state';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	IDENTITY_THEFT_CARD_ID,
	KNOWN_DRAWN_DECK_OPPONENT_PLAYER_ID,
	PRIMORDIAL_LORD_CARD_ID,
	WICKED_BLIGHTSPAWN_CARD_ID,
	parseKnownDrawnDeckFixture,
} from './known-drawn-deck-power-log-helpers';

const slug = 'known-drawn-deck';
const DK_HERO_CARD_ID = 'HERO_11z';
const PRIEST_HERO_CARD_ID = 'HERO_09at';

const knownCount = (cardId: string, deck: DeckState): number =>
	deck.deck.filter((card) => card.cardId === cardId).length +
	deck.additionalKnownCardsInDeck.filter((id) => id === cardId).length;

const blightspawnInHand = (deck: DeckState) => deck.hand.filter((card) => card.cardId === WICKED_BLIGHTSPAWN_CARD_ID);

const deckByHero = (decks: readonly DeckState[], heroCardId: string): DeckState => {
	const match = decks.find((deck) => deck.hero?.cardId === heroCardId);
	if (!match) {
		throw new Error(`[known-drawn-deck] No deck with hero ${heroCardId}`);
	}
	return match;
};

describe('Power log replay → GameStateService (known deck card leftover after Keymaster draw copy)', () => {
	it('grounds Identity Theft Blightspawn reveal, DECK→HAND, and Keymaster copy in the fixture', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const fixture = parseKnownDrawnDeckFixture(raw.split(/\r?\n/));

		expect(IDENTITY_THEFT_CARD_ID).toBe(CardIds.IdentityTheft);
		expect(WICKED_BLIGHTSPAWN_CARD_ID).toBe(CardIds.WickedBlightspawn_END_002);
		expect(PRIMORDIAL_LORD_CARD_ID).toBe(CardIds.PrimordialLord_CATA_EVENT_000);
		expect(fixture.opponentPlayerId).toBe(KNOWN_DRAWN_DECK_OPPONENT_PLAYER_ID);
		expect(fixture.blightspawnSourceEntityId).toBe(18);
		expect(fixture.identityTheftBlightspawnCopyEntityId).toBe(85);
		expect(fixture.keymasterBlightspawnCopyEntityId).toBe(180);
		expect(fixture.primordialLordSourceEntityId).toBe(26);
		expect(fixture.sourceDrewToHand).toBe(true);
		expect(raw).toContain('PowerProcessor.EndCurrentTaskList() - m_currentTaskList=634');
		expect(raw).not.toContain(
			'SHOW_ENTITY - Updating Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=7 zone=HAND zonePos=2 cardId= player=1] CardID=TIME_040',
		);
	});

	it('replays known-drawn-deck.log: drawn Wicked Blightspawn is gone from DK remaining deck', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const fixture = parseKnownDrawnDeckFixture(fs.readFileSync(logPath, 'utf8').split(/\r?\n/));

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'known-drawn-deck-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			const dkDeck = deckByHero([ctx.state.playerDeck, ctx.state.opponentDeck], DK_HERO_CARD_ID);
			const priestDeck = deckByHero([ctx.state.playerDeck, ctx.state.opponentDeck], PRIEST_HERO_CARD_ID);

			const dkHand = blightspawnInHand(dkDeck);
			const priestHand = blightspawnInHand(priestDeck);
			expect(dkHand.map((card) => card.entityId ?? card.trueEntityId)).toContain(
				fixture.blightspawnSourceEntityId,
			);
			expect(priestHand.map((card) => card.entityId ?? card.trueEntityId)).toContain(
				fixture.keymasterBlightspawnCopyEntityId,
			);

			expect(knownCount(WICKED_BLIGHTSPAWN_CARD_ID, dkDeck)).toBe(0);
			expect(knownCount(PRIMORDIAL_LORD_CARD_ID, dkDeck)).toBe(1);
			expect(knownCount(WICKED_BLIGHTSPAWN_CARD_ID, priestDeck)).toBe(0);
		} finally {
			ctx.cleanup();
		}
	}, 180_000);
});
