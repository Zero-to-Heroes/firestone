import { CardIds } from '@firestone-hs/reference-data';

export const GODFREY_ATLAS_CREATOR = CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e;

const GODFREY_RETURN_SUB_SPELL = 'JAILFX_Godfrey_CardsInHand_OverrideSpawn';
const BURNED_CARD_META = 'META_DATA - Meta=BURNED_CARD';

export interface GodfreyBurnedCardFromLog {
	readonly entityId: number;
	readonly cardId: string;
}

/**
 * Parses burned overdraw cards from the Godfrey overdraw BURNED_CARD block in the fixture.
 * Anchored on GODFREY_OVERDRAW_PROTECTION so we skip unrelated BURNED_CARD events.
 */
export function parseGodfreyBurnedCards(raw: string): GodfreyBurnedCardFromLog[] {
	const anchor = raw.indexOf('tag=GODFREY_OVERDRAW_PROTECTION value=1');
	if (anchor < 0) {
		return [];
	}
	const metaIdx = raw.indexOf(BURNED_CARD_META, anchor);
	if (metaIdx < 0) {
		return [];
	}
	const blockEnd = raw.indexOf('SUB_SPELL_END', metaIdx);
	const block = raw.slice(metaIdx, blockEnd > metaIdx ? blockEnd : metaIdx + 1500);
	const infoRe = /Info\[\d+\] = \[entityName=.+ id=(\d+) zone=\w+ zonePos=\d+ cardId= player=2\]/g;
	const entityIds: number[] = [];
	let m: RegExpExecArray | null;
	while ((m = infoRe.exec(block)) !== null) {
		entityIds.push(Number(m[1]));
	}
	if (entityIds.length === 0) {
		return [];
	}
	const prefix = raw.slice(0, metaIdx);
	const result: GodfreyBurnedCardFromLog[] = [];
	for (const entityId of entityIds) {
		const showRe = new RegExp(
			`id=${entityId} zone=\\w+ zonePos=\\d+ cardId= player=2\\] CardID=(\\w+)`,
			'g',
		);
		let lastCardId: string | null = null;
		let showMatch: RegExpExecArray | null;
		while ((showMatch = showRe.exec(prefix)) !== null) {
			lastCardId = showMatch[1];
		}
		if (lastCardId) {
			result.push({ entityId, cardId: lastCardId });
		}
	}
	return result;
}

/**
 * Entity ids moved SETASIDE → HAND by Godfrey's CardsInHand_OverrideSpawn (Source= matches returned token).
 */
export function parseGodfreyReturnedHandEntityIds(raw: string): number[] {
	const ids = new Set<number>();
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
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			if (
				lines[j].includes(`id=${entityId} zone=SETASIDE`) &&
				lines[j].includes('tag=ZONE value=HAND')
			) {
				ids.add(entityId);
				break;
			}
		}
	}
	return [...ids].sort((a, b) => a - b);
}
