import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

/** Azalina Soulsever entity (start-of-game deck copies). */
export const AZALINA_CREATOR_ENTITY = 19;

/** Deck entity ids with DISPLAYED_CREATOR=19 at game start (even ids 58–96). */
export const AZALINA_COPY_ENTITY_IDS = [
	58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96,
] as const;

/** Azalina copy drawn by battlecry and played as Spiderling. */
export const PLAYED_COPY_ENTITY = 92;

export const SPIDERLING_CARD_ID = CardIds.Spiderling_JAIL_202;
export const AZALINA_CARD_ID = CardIds.AzalinaSoulsever_JAIL_430;

/** Opponent (HeXecutor) controller when local player is Chmielinho. */
export const AZALINA_PLAYER_CONTROLLER = 1;

export const EXPECTED_AZALINA_COPIES_AFTER_PLAY = AZALINA_COPY_ENTITY_IDS.length - 1;

/**
 * Parse Azalina Soulsever deck-copy entity ids from raw log (DISPLAYED_CREATOR=19 on DECK rows).
 */
export function parseAzalinaDeckCopyEntityIdsFromLog(lines: readonly string[]): number[] {
	const joined = lines.join('\n');
	const re =
		/id=(\d+) zone=DECK zonePos=0 cardId= player=1\] tag=DISPLAYED_CREATOR value=19/g;
	const ids: number[] = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(joined)) !== null) {
		ids.push(parseInt(m[1], 10));
	}
	return [...new Set(ids)].sort((a, b) => a - b);
}

export function countAzalinaDeckCopyEntityIdsFromLog(lines: readonly string[]): number {
	return parseAzalinaDeckCopyEntityIdsFromLog(lines).length;
}

export function prepareAzalinaSoulseverDeckFixtureLines(raw: string): readonly string[] {
	return trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
}

export function azalinaCasterDeckFromReplayState(state: {
	readonly localPlayerId: number;
	readonly playerDeck: { readonly deck: readonly DeckCard[] };
	readonly opponentDeck: { readonly deck: readonly DeckCard[] };
}) {
	return state.localPlayerId === AZALINA_PLAYER_CONTROLLER ? state.playerDeck : state.opponentDeck;
}

export function assertAzalinaSoulseverDeckAnchorsFromPowerLogLines(lines: readonly string[]): void {
	const joined = lines.join('\n');
	if (!lines.some((l) => l.includes('CREATE_GAME'))) {
		throw new Error('fixture must contain CREATE_GAME');
	}
	if (!joined.includes(`CardID=${AZALINA_CARD_ID}`)) {
		throw new Error(`fixture must contain Azalina Soulsever (${AZALINA_CARD_ID})`);
	}
	const copyCount = countAzalinaDeckCopyEntityIdsFromLog(lines);
	if (copyCount !== AZALINA_COPY_ENTITY_IDS.length) {
		throw new Error(
			`fixture must create ${AZALINA_COPY_ENTITY_IDS.length} Azalina deck copies (found ${copyCount})`,
		);
	}
	if (!joined.includes(`id=${PLAYED_COPY_ENTITY} zone=DECK zonePos=0 cardId= player=1] tag=ZONE value=HAND`)) {
		throw new Error(`fixture must draw Azalina copy entity ${PLAYED_COPY_ENTITY} to hand`);
	}
	if (
		!joined.includes(
			`BLOCK_START BlockType=PLAY Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=${PLAYED_COPY_ENTITY} zone=HAND`,
		) &&
		!joined.includes(
			`BLOCK_START BlockType=PLAY Entity=[entityName=Spiderling id=${PLAYED_COPY_ENTITY} zone=HAND zonePos=`,
		)
	) {
		throw new Error(`fixture must contain PLAY block for entity ${PLAYED_COPY_ENTITY}`);
	}
	if (!joined.includes(`CardID=${SPIDERLING_CARD_ID}`)) {
		throw new Error(`fixture must reveal entity ${PLAYED_COPY_ENTITY} as ${SPIDERLING_CARD_ID}`);
	}
	if (!joined.includes('PlayerID=2, PlayerName=Chmielinho#2928')) {
		throw new Error('fixture must identify local player Chmielinho (player 2)');
	}
}
