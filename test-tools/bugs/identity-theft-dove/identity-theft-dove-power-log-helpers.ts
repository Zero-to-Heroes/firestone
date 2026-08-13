/**
 * Parse sequential Identity Theft (REV_253) deck discovers of Disciple of the Dove (TIME_037).
 *
 * Identity Theft: "Discover a copy of a card from your opponent's hand and deck."
 * Disciple of the Dove: "Battlecry: Draw a minion. Give minions in your hand +2 Health."
 *
 * Fixture: Chmielinho#2928 (player 2) vs Alan#22298 (player 1). Local player casts Identity Theft
 * twice. Each play's second discover is from the opponent deck and offers one TIME_037. The log
 * leaks two COPIED_FROM_ENTITY_ID values (23 then 35); the player cannot tell those are distinct
 * cards, so the tracker must not increment.
 */

import { CardIds } from '@firestone-hs/reference-data';

const IDENTITY_THEFT_PLAY =
	/GameState\.DebugPrintPower\(\) - BLOCK_START BlockType=PLAY Entity=\[entityName=Identity Theft id=(\d+)[^\n]*cardId=REV_253 player=(\d+)\]/;
const ENTITY_CHOICES_HEADER =
	/GameState\.DebugPrintEntityChoices\(\) - id=(\d+) Player=.* TaskList=\d+ ChoiceType=GENERAL/;
const IDENTITY_THEFT_CHOICE_SOURCE =
	/GameState\.DebugPrintEntityChoices\(\) -   Source=\[entityName=Identity Theft id=(\d+) zone=PLAY zonePos=0 cardId=REV_253 player=(\d+)\]/;
const CHOICE_OPTION =
	/GameState\.DebugPrintEntityChoices\(\) -   Entities\[\d+\]=\[entityName=.* id=(\d+) zone=SETASIDE zonePos=0 cardId=([A-Z0-9_]+) player=\d+\]/;
const DOVE_COPIED_FROM =
	/PowerTaskList\.DebugPrintPower\(\) -     TAG_CHANGE Entity=\[entityName=Disciple of the Dove id=(\d+) zone=SETASIDE zonePos=0 cardId=TIME_037 player=\d+\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;

export const IDENTITY_THEFT_CARD_ID = CardIds.IdentityTheft;
export const DISCIPLE_OF_THE_DOVE_CARD_ID = CardIds.DiscipleOfTheDove_TIME_037;

/** Power.log player id of the opponent whose deck is being copied (Alan). */
export const IDENTITY_THEFT_DOVE_OPPONENT_PLAYER_ID = 1;

export type IdentityTheftDoveDeckDiscover = {
	readonly identityTheftEntityId: number;
	readonly choiceId: number;
	readonly doveCopyEntityId: number;
	readonly leakedSourceEntityId: number;
	readonly doveOptionCount: number;
};

export type IdentityTheftDoveFixtureCounts = {
	readonly opponentPlayerId: number;
	readonly identityTheftPlayCount: number;
	readonly deckDiscoversWithDove: readonly IdentityTheftDoveDeckDiscover[];
	readonly leakedSourceEntityIds: readonly number[];
};

type ParsedChoice = {
	readonly choiceId: number;
	readonly identityTheftEntityId: number;
	readonly casterPlayerId: number;
	readonly options: readonly { entityId: number; cardId: string }[];
};

/**
 * Ground sequential Identity Theft Dove deck reveals in the fixture log (not guessed).
 */
export function parseIdentityTheftDoveFixtureCounts(lines: readonly string[]): IdentityTheftDoveFixtureCounts {
	const identityTheftPlayIds = new Set<number>();
	for (const line of lines) {
		const play = line.match(IDENTITY_THEFT_PLAY);
		if (play) {
			identityTheftPlayIds.add(parseInt(play[1], 10));
		}
	}

	const choices: ParsedChoice[] = [];
	for (let i = 0; i < lines.length; i++) {
		const source = lines[i].match(IDENTITY_THEFT_CHOICE_SOURCE);
		if (!source) {
			continue;
		}
		let choiceId: number | undefined;
		for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
			const header = lines[j].match(ENTITY_CHOICES_HEADER);
			if (header) {
				choiceId = parseInt(header[1], 10);
				break;
			}
		}
		if (choiceId == null) {
			continue;
		}
		const options: { entityId: number; cardId: string }[] = [];
		for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
			const opt = lines[j].match(CHOICE_OPTION);
			if (!opt) {
				break;
			}
			options.push({ entityId: parseInt(opt[1], 10), cardId: opt[2] });
		}
		choices.push({
			choiceId,
			identityTheftEntityId: parseInt(source[1], 10),
			casterPlayerId: parseInt(source[2], 10),
			options,
		});
	}

	if (choices.length === 0) {
		throw new Error('[identity-theft-dove] Could not find Identity Theft EntityChoices in fixture log');
	}

	const copiedFromByCopyEntity = new Map<number, number>();
	for (const line of lines) {
		const copied = line.match(DOVE_COPIED_FROM);
		if (copied) {
			copiedFromByCopyEntity.set(parseInt(copied[1], 10), parseInt(copied[2], 10));
		}
	}

	const byCaster = new Map<number, ParsedChoice[]>();
	for (const choice of choices) {
		const group = byCaster.get(choice.identityTheftEntityId) ?? [];
		group.push(choice);
		byCaster.set(choice.identityTheftEntityId, group);
	}

	const deckDiscoversWithDove: IdentityTheftDoveDeckDiscover[] = [];
	for (const group of byCaster.values()) {
		const ordered = [...group].sort((a, b) => a.choiceId - b.choiceId);
		// Identity Theft: first discover is opponent hand, second is opponent deck.
		const deckDiscover = ordered[1];
		if (!deckDiscover) {
			continue;
		}
		const doveOptions = deckDiscover.options.filter((opt) => opt.cardId === DISCIPLE_OF_THE_DOVE_CARD_ID);
		if (doveOptions.length === 0) {
			continue;
		}
		const doveCopyEntityId = doveOptions[0].entityId;
		const leakedSourceEntityId = copiedFromByCopyEntity.get(doveCopyEntityId);
		if (leakedSourceEntityId == null) {
			throw new Error(
				`[identity-theft-dove] Could not find COPIED_FROM_ENTITY_ID for Dove copy entity ${doveCopyEntityId}`,
			);
		}
		deckDiscoversWithDove.push({
			identityTheftEntityId: deckDiscover.identityTheftEntityId,
			choiceId: deckDiscover.choiceId,
			doveCopyEntityId,
			leakedSourceEntityId,
			doveOptionCount: doveOptions.length,
		});
	}

	if (deckDiscoversWithDove.length === 0) {
		throw new Error('[identity-theft-dove] Could not find Identity Theft deck discovers offering TIME_037');
	}

	return {
		opponentPlayerId: IDENTITY_THEFT_DOVE_OPPONENT_PLAYER_ID,
		identityTheftPlayCount: identityTheftPlayIds.size,
		deckDiscoversWithDove,
		leakedSourceEntityIds: deckDiscoversWithDove.map((d) => d.leakedSourceEntityId),
	};
}
