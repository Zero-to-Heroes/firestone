/**
 * Parse Identity Theft deck reveal of Wicked Blightspawn (END_002) and the later Keymaster
 * Alabaster copy of that same source entity after it is drawn.
 *
 * Identity Theft (REV_253): "Discover a copy of a card from your opponent's hand and deck."
 * Wicked Blightspawn (END_002): "Reborn. Deathrattle: Equip a 1/2 Dagger..."
 * Keymaster Alabaster (CORE_SCH_717): "Whenever your opponent draws a card, add a copy to your hand."
 * Primordial Lord (CATA_EVENT_000): never drawn in this fixture; remaining-deck control.
 *
 * Fixture: Chmielinho#2928 (player 2, local Priest) vs youzeqq#2689 (player 1, opponent DK).
 * Truncated after Keymaster's PowerTaskList 634 ends (entity 180 in hand, source 18 drawn).
 */

import { CardIds } from '@firestone-hs/reference-data';

const IDENTITY_THEFT_BLIGHTSPAWN_COPY =
	/PowerTaskList\.DebugPrintPower\(\) -     TAG_CHANGE Entity=\[entityName=Wicked Blightspawn id=(\d+) zone=SETASIDE zonePos=0 cardId=END_002 player=2\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;
const IDENTITY_THEFT_PRIMORDIAL_COPY =
	/PowerTaskList\.DebugPrintPower\(\) -     TAG_CHANGE Entity=\[entityName=Primordial Lord id=(\d+) zone=SETASIDE zonePos=0 cardId=CATA_EVENT_000 player=2\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;
const SOURCE_DRAW =
	/GameState\.DebugPrintPower\(\) -     TAG_CHANGE Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+) zone=DECK zonePos=0 cardId= player=1\] tag=ZONE value=HAND/;
const KEYMASTER_BLIGHTSPAWN_COPY =
	/PowerTaskList\.DebugPrintPower\(\) -     TAG_CHANGE Entity=\[entityName=Wicked Blightspawn id=(\d+) zone=HAND zonePos=\d+ cardId=END_002 player=2\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;

export const WICKED_BLIGHTSPAWN_CARD_ID = CardIds.WickedBlightspawn_END_002;
export const PRIMORDIAL_LORD_CARD_ID = CardIds.PrimordialLord_CATA_EVENT_000;
export const IDENTITY_THEFT_CARD_ID = CardIds.IdentityTheft;

/** Power.log player id of the Death Knight whose deck is being tracked. */
export const KNOWN_DRAWN_DECK_OPPONENT_PLAYER_ID = 1;

export type KnownDrawnDeckFixture = {
	readonly opponentPlayerId: number;
	readonly blightspawnSourceEntityId: number;
	readonly identityTheftBlightspawnCopyEntityId: number;
	readonly keymasterBlightspawnCopyEntityId: number;
	readonly primordialLordSourceEntityId: number;
	readonly sourceDrewToHand: boolean;
};

/**
 * Ground Identity Theft END_002 deck reveal, later DECK→HAND of that entity, and Keymaster copy.
 */
export function parseKnownDrawnDeckFixture(lines: readonly string[]): KnownDrawnDeckFixture {
	let blightspawnSourceEntityId: number | undefined;
	let identityTheftBlightspawnCopyEntityId: number | undefined;
	let keymasterBlightspawnCopyEntityId: number | undefined;
	let primordialLordSourceEntityId: number | undefined;

	for (const line of lines) {
		if (identityTheftBlightspawnCopyEntityId == null) {
			const identityCopy = line.match(IDENTITY_THEFT_BLIGHTSPAWN_COPY);
			if (identityCopy) {
				identityTheftBlightspawnCopyEntityId = parseInt(identityCopy[1], 10);
				blightspawnSourceEntityId = parseInt(identityCopy[2], 10);
			}
		}
		if (primordialLordSourceEntityId == null) {
			const primordialCopy = line.match(IDENTITY_THEFT_PRIMORDIAL_COPY);
			if (primordialCopy) {
				primordialLordSourceEntityId = parseInt(primordialCopy[2], 10);
			}
		}
		const keymasterCopy = line.match(KEYMASTER_BLIGHTSPAWN_COPY);
		if (keymasterCopy) {
			keymasterBlightspawnCopyEntityId = parseInt(keymasterCopy[1], 10);
			const keymasterSource = parseInt(keymasterCopy[2], 10);
			if (blightspawnSourceEntityId != null && keymasterSource !== blightspawnSourceEntityId) {
				throw new Error(
					`[known-drawn-deck] Keymaster copied entity ${keymasterSource}, expected Identity Theft source ${blightspawnSourceEntityId}`,
				);
			}
		}
	}

	if (
		blightspawnSourceEntityId == null ||
		identityTheftBlightspawnCopyEntityId == null ||
		keymasterBlightspawnCopyEntityId == null ||
		primordialLordSourceEntityId == null
	) {
		throw new Error('[known-drawn-deck] Could not find Identity Theft / Keymaster Blightspawn anchors in fixture');
	}

	const sourceDrawPattern = new RegExp(
		`id=${blightspawnSourceEntityId} zone=DECK zonePos=0 cardId= player=1\\] tag=ZONE value=HAND`,
	);
	const sourceDrewToHand = lines.some((line) => SOURCE_DRAW.test(line) && sourceDrawPattern.test(line));
	if (!sourceDrewToHand) {
		throw new Error(
			`[known-drawn-deck] Opponent entity ${blightspawnSourceEntityId} DECK→HAND draw not found in fixture`,
		);
	}

	return {
		opponentPlayerId: KNOWN_DRAWN_DECK_OPPONENT_PLAYER_ID,
		blightspawnSourceEntityId,
		identityTheftBlightspawnCopyEntityId,
		keymasterBlightspawnCopyEntityId,
		primordialLordSourceEntityId,
		sourceDrewToHand,
	};
}
