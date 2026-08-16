/**
 * Regression: Mystic Misdirection (JAIL_315) must appear as a live Mage Secret Helper
 * option when the opponent hangs an unknown Mage secret.
 *
 * Secret: When an enemy minion attacks, transform it into a 1/1 Sheep.
 *
 * Fixture: opponent Mage plays unknown 3-cost secret entity 95 from hand. Prefix stops
 * at the first EndCurrentTaskList after that PTL ZONE=SECRET, before the later minion
 * attack / Explosive Runes (CORE_LOOT_101) reveal.
 *
 * A second prefix continues through Origin Stone secret entity 237 and Deathwing's
 * hero attack on the Mage (must not rule out JAIL_315), stopping before Murozond attacks.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/mystic-misdirection/power-log-mystic-misdirection-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import type { GameState } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';
import {
	HAND_PLAYED_MAGE_SECRET_ENTITY_ID,
	ORIGIN_STONE_MAGE_SECRET_ENTITY_ID,
	parseEntity95HungMarkers,
	parseEntity237HeroAttackMarkers,
	slicePowerLogAfterEntity95Hung,
	slicePowerLogAfterEntity237HeroAttack,
} from './mystic-misdirection-power-log-helpers';

function findOpponentSecret(state: GameState, entityId: number) {
	const all = [...state.opponentDeck.secrets, ...state.playerDeck.secrets];
	return all.find((s) => s.entityId === entityId);
}

describe('Power log replay → GameStateService (Mystic Misdirection secret helper)', () => {
	const slug = 'mystic-misdirection';

	it('fixture: entity 95 enters SECRET before the Genn attack and Explosive Runes reveal', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const markers = parseEntity95HungMarkers(lines);
		expect(lines[markers.ptlSecretZoneIndex]).toContain(`id=${HAND_PLAYED_MAGE_SECRET_ENTITY_ID}`);
		expect(lines[markers.ptlSecretZoneIndex]).toContain('tag=ZONE value=SECRET');
		expect(lines[markers.endTaskListAfterSecretIndex]).toContain('EndCurrentTaskList');
		expect(markers.minionAttackIndex).toBeGreaterThan(markers.endTaskListAfterSecretIndex);
		expect(lines[markers.explosiveRunesRevealIndex]).toContain('CardID=CORE_LOOT_101');
	});

	it('keeps Mystic Misdirection as a valid option when the Mage hangs unknown secret 95', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const prefix = slicePowerLogAfterEntity95Hung(lines);

		const ctx = await replayPowerLogToGameState({
			logPath,
			logLinesOverride: prefix,
			reviewId: 'mystic-misdirection-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const boardSecret = findOpponentSecret(state, HAND_PLAYED_MAGE_SECRET_ENTITY_ID);
		if (boardSecret == null) {
			const dump = (secrets: typeof state.opponentDeck.secrets) =>
				JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
			throw new Error(
				`Unknown Mage secret entity ${HAND_PLAYED_MAGE_SECRET_ENTITY_ID} missing — opponent: ${dump(
					state.opponentDeck.secrets,
				)} player: ${dump(state.playerDeck.secrets)}`,
			);
		}

		const mysticMisdirection = boardSecret.allPossibleOptions.find(
			(o) => o.cardId === CardIds.MysticMisdirection_JAIL_315,
		);
		expect(mysticMisdirection).toBeDefined();
		expect(mysticMisdirection!.isValidOption).toBe(true);
	}, 180_000);

	it('fixture: entity 237 enters SECRET, then Deathwing hero-attacks before Murozond', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const markers = parseEntity237HeroAttackMarkers(lines);
		expect(lines[markers.ptlSecretZoneIndex]).toContain(`id=${ORIGIN_STONE_MAGE_SECRET_ENTITY_ID}`);
		expect(lines[markers.ptlSecretZoneIndex]).toContain('tag=ZONE value=SECRET');
		expect(lines[markers.deathwingHeroAttackIndex]).toContain('HERO_01bn');
		expect(lines[markers.deathwingHeroAttackIndex]).toContain('HERO_08ac');
		expect(lines[markers.endTaskListAfterHeroAttackIndex]).toContain('EndCurrentTaskList');
		expect(markers.murozondAttackIndex).toBeGreaterThan(markers.endTaskListAfterHeroAttackIndex);
		expect(lines[markers.murozondAttackIndex]).toContain('TIME_024');
	});

	it('keeps Mystic Misdirection valid after a hero attack into Origin Stone secret 237', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const prefix = slicePowerLogAfterEntity237HeroAttack(lines);

		const ctx = await replayPowerLogToGameState({
			logPath,
			logLinesOverride: prefix,
			reviewId: 'mystic-misdirection-hero-attack-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const boardSecret = findOpponentSecret(state, ORIGIN_STONE_MAGE_SECRET_ENTITY_ID);
		if (boardSecret == null) {
			const dump = (secrets: typeof state.opponentDeck.secrets) =>
				JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
			throw new Error(
				`Unknown Mage secret entity ${ORIGIN_STONE_MAGE_SECRET_ENTITY_ID} missing — opponent: ${dump(
					state.opponentDeck.secrets,
				)} player: ${dump(state.playerDeck.secrets)}`,
			);
		}

		const mysticMisdirection = boardSecret.allPossibleOptions.find(
			(o) => o.cardId === CardIds.MysticMisdirection_JAIL_315,
		);
		expect(mysticMisdirection).toBeDefined();
		expect(mysticMisdirection!.isValidOption).toBe(true);
	}, 180_000);
});
