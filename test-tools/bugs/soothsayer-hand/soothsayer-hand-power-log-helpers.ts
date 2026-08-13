/**
 * Incriminating Psychic (MAW_022) deathrattle copies two opponent-hand cards into the local hand.
 * Fixture: soothsayer-hand.log — both copies are Soothsayer (JAIL_912) from source entities 56 and 60.
 */

const PSYCHIC_DEATHRATTLE =
	/PowerTaskList\.DebugPrintPower\(\) - BLOCK_START BlockType=TRIGGER Entity=\[entityName=Incriminating Psychic id=(\d+) zone=GRAVEYARD[^\]]*cardId=(MAW_022|CORE_MAW_022) player=1\][^\n]*TriggerKeyword=DEATHRATTLE/;

const FULL_ENTITY_COPY =
	/PowerTaskList\.DebugPrintPower\(\) - +FULL_ENTITY - Updating \[entityName=Soothsayer id=(\d+) zone=HAND[^\]]*cardId=([A-Za-z0-9_]+) player=1\] CardID=([A-Za-z0-9_]+)/;

const COPIED_FROM_TAG =
	/PowerTaskList\.DebugPrintPower\(\) - +TAG_CHANGE Entity=\[entityName=Soothsayer id=(\d+) zone=HAND[^\]]*\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;

export const SOOTHSAYER_CARD_ID = 'JAIL_912';

export type SoothsayerHandCopy = {
	readonly copyEntityId: number;
	readonly copyCardId: string;
	readonly sourceEntityId: number;
};

export type SoothsayerHandFixture = {
	readonly psychicEntityId: number;
	readonly psychicCardId: string;
	readonly copies: readonly SoothsayerHandCopy[];
};

/**
 * Ground expected overlay count in PowerTaskList deathrattle copies (not guessed).
 */
export function parseIncriminatingPsychicSoothsayerCopiesFromLog(lines: readonly string[]): SoothsayerHandFixture {
	let deathrattleIndex = -1;
	let psychicEntityId = 0;
	let psychicCardId = '';
	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(PSYCHIC_DEATHRATTLE);
		if (match) {
			deathrattleIndex = i;
			psychicEntityId = parseInt(match[1], 10);
			psychicCardId = match[2];
		}
	}
	if (deathrattleIndex < 0) {
		throw new Error('[soothsayer-hand] Missing Incriminating Psychic DEATHRATTLE TRIGGER in PowerTaskList');
	}

	const copiesByEntity = new Map<number, SoothsayerHandCopy>();
	for (let i = deathrattleIndex + 1; i < lines.length; i++) {
		const fullEntity = lines[i].match(FULL_ENTITY_COPY);
		if (fullEntity) {
			const copyEntityId = parseInt(fullEntity[1], 10);
			const copyCardId = fullEntity[3] || fullEntity[2];
			copiesByEntity.set(copyEntityId, {
				copyEntityId,
				copyCardId,
				sourceEntityId: copiesByEntity.get(copyEntityId)?.sourceEntityId ?? 0,
			});
			continue;
		}
		const copiedFrom = lines[i].match(COPIED_FROM_TAG);
		if (copiedFrom) {
			const copyEntityId = parseInt(copiedFrom[1], 10);
			const sourceEntityId = parseInt(copiedFrom[2], 10);
			const existing = copiesByEntity.get(copyEntityId);
			copiesByEntity.set(copyEntityId, {
				copyEntityId,
				copyCardId: existing?.copyCardId ?? SOOTHSAYER_CARD_ID,
				sourceEntityId,
			});
		}
	}

	const copies = [...copiesByEntity.values()].filter(
		(c) => c.copyCardId === SOOTHSAYER_CARD_ID && c.sourceEntityId > 0,
	);
	if (copies.length < 2) {
		throw new Error(
			`[soothsayer-hand] Expected at least 2 PowerTaskList Soothsayer copies with COPIED_FROM_ENTITY_ID, got ${copies.length}`,
		);
	}

	return { psychicEntityId, psychicCardId, copies };
}
