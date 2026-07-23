import { CardIds } from '@firestone-hs/reference-data';

export const GODFREY_ATLAS_CREATOR = CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e;

const GODFREY_RETURN_SUB_SPELL = 'JAILFX_Godfrey_CardsInHand_OverrideSpawn';

export interface GodfreyReturnedHandEntityFromLog {
	readonly entityId: number;
	readonly player: number;
}

export interface GodfreyStampPairFromLog {
	/** Return token entity (COPIED_FROM target) that later moves SETASIDE → HAND. */
	readonly returnEntityId: number;
	/** Card id revealed on the history copy that stamped the return token. */
	readonly stampedCardId: string;
}

/**
 * Entity ids moved SETASIDE → HAND by Godfrey's CardsInHand_OverrideSpawn (Source ≠ 0).
 * Optionally filter by controller (`player=` on the ZONE=HAND line).
 */
export function parseGodfreyReturnedHandEntities(
	raw: string,
	playerFilter?: number,
): GodfreyReturnedHandEntityFromLog[] {
	const byId = new Map<number, GodfreyReturnedHandEntityFromLog>();
	const lines = raw.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes(GODFREY_RETURN_SUB_SPELL)) {
			continue;
		}
		const sourceMatch = line.match(/Source=(\d+) TargetCount=/);
		if (!sourceMatch) {
			continue;
		}
		const entityId = Number(sourceMatch[1]);
		if (entityId === 0) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			const zoneLine = lines[j];
			if (
				!zoneLine.includes(`id=${entityId} zone=SETASIDE`) ||
				!zoneLine.includes('tag=ZONE value=HAND')
			) {
				continue;
			}
			const playerMatch = zoneLine.match(/player=(\d+)/);
			const player = playerMatch ? Number(playerMatch[1]) : -1;
			if (playerFilter != null && player !== playerFilter) {
				break;
			}
			byId.set(entityId, { entityId, player });
			break;
		}
	}
	return [...byId.values()].sort((a, b) => a.entityId - b.entityId);
}

export function parseGodfreyReturnedHandEntityIds(raw: string, playerFilter?: number): number[] {
	return parseGodfreyReturnedHandEntities(raw, playerFilter).map((e) => e.entityId);
}

/**
 * History-copy stamps: SHOW_ENTITY with CardID + COPIED_FROM_ENTITY_ID pointing at a return token.
 * Only includes pairs whose return token later enters hand via OverrideSpawn.
 */
export function parseGodfreyStampPairsForReturnedHand(raw: string, playerFilter?: number): GodfreyStampPairFromLog[] {
	const returnedIds = new Set(parseGodfreyReturnedHandEntityIds(raw, playerFilter));
	if (returnedIds.size === 0) {
		return [];
	}
	const stamped = new Map<number, string>();
	const lines = raw.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const showMatch = line.match(/SHOW_ENTITY - Updating Entity=.+ CardID=(\w+)/);
		if (!showMatch) {
			continue;
		}
		const cardId = showMatch[1];
		let copiedFrom: number | null = null;
		for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
			if (lines[j].includes('SHOW_ENTITY -') || lines[j].includes('FULL_ENTITY -')) {
				break;
			}
			const copyMatch = lines[j].match(/tag=COPIED_FROM_ENTITY_ID value=(\d+)/);
			if (copyMatch) {
				copiedFrom = Number(copyMatch[1]);
				break;
			}
		}
		if (copiedFrom != null && returnedIds.has(copiedFrom) && cardId?.length) {
			stamped.set(copiedFrom, cardId);
		}
	}
	return [...stamped.entries()]
		.map(([returnEntityId, stampedCardId]) => ({ returnEntityId, stampedCardId }))
		.sort((a, b) => a.returnEntityId - b.returnEntityId);
}
