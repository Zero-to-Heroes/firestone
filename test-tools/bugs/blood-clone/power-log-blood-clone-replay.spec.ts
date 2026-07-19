/**
 * Regression (Phase 1 — red test): Opponent plays Blood Clone, discovers a 5-cost minion, summons a
 * copy to board and puts another in hand. The hand copy created by Blood Clone must resolve to the
 * same cardId as the summoned copy (visible on board).
 *
 * Fixture: `blood-clone.log` (copy of test-tools/power.log). Opponent Blood Clone (entity 60),
 * discovers entity 139, summons entity 142 as JAIL_453 (Jailbird).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/blood-clone/power-log-blood-clone-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	BLOOD_CLONE_CARD_ID,
	parseBloodCloneCreatorEntityId,
	parseChosenHandEntityIdFromBloodCloneDiscover,
	parseSummonedCopyCardIdFromBloodClone,
} from './blood-clone-power-log-helpers';

describe('Power log replay → opponent Blood Clone hand copy identity', () => {
	it('fixture: last game contains Blood Clone discover and JAIL_453 summon', () => {
		const logPath = resolvePowerLogPathForSlug('blood-clone');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines[0]?.includes('CREATE_GAME')).toBe(true);
		const joined = lines.join('\n');

		const creatorEntityId = parseBloodCloneCreatorEntityId(joined);
		expect(creatorEntityId).not.toBeNull();
		const chosenEntityId = parseChosenHandEntityIdFromBloodCloneDiscover(joined);
		expect(chosenEntityId).not.toBeNull();
		const summonedCardId = parseSummonedCopyCardIdFromBloodClone(joined, creatorEntityId!);
		expect(summonedCardId).toBe(CardIds.Jailbird_JAIL_453);

		expect(joined).toMatch(/cardId=JAIL_451/);
		expect(joined).toMatch(/SHOW_ENTITY - Updating Entity=142 CardID=JAIL_453/);
		expect(joined).toMatch(
			new RegExp(`DISPLAYED_CREATOR value=${creatorEntityId}`),
		);
	});

	it(
		'replays log; Blood Clone hand copy matches summoned copy cardId',
		async () => {
			const logPath = resolvePowerLogPathForSlug('blood-clone');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const joined = trimPowerLogLinesToLastGame(raw.split(/\r?\n/)).join('\n');

			const creatorEntityId = parseBloodCloneCreatorEntityId(joined);
			const chosenEntityId = parseChosenHandEntityIdFromBloodCloneDiscover(joined);
			const expectedCardId = parseSummonedCopyCardIdFromBloodClone(joined, creatorEntityId!);
			expect(creatorEntityId).not.toBeNull();
			expect(chosenEntityId).not.toBeNull();
			expect(expectedCardId).toBe(CardIds.Jailbird_JAIL_453);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'blood-clone-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const handCard = ctx.state.opponentDeck.hand.find(
				(c: DeckCard) => (c.entityId ?? c.trueEntityId) === chosenEntityId,
			);
			expect(handCard).toBeDefined();
			expect(handCard!.creatorCardId).toBe(BLOOD_CLONE_CARD_ID);
			expect(handCard!.cardId).toBe(expectedCardId);
		},
		180_000,
	);
});
