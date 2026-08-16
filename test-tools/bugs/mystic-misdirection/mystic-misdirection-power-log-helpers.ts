/**
 * Fixture-grounded cuts for mystic-misdirection.log.
 *
 * Mystic Misdirection (JAIL_315): Secret: When an enemy minion attacks, transform it into a 1/1 Sheep.
 *
 * Opponent Mage (player 2) plays unknown 3-cost secret entity 95 from hand (~16:12:53 PTL).
 * That secret later reveals as Explosive Runes (CORE_LOOT_101) after a minion is played.
 * Prefix for the "hung secret" assertion must include the PTL ZONE=SECRET for 95 and stop
 * before the 16:13:20 minion attack / Explosive Runes reveal.
 *
 * Later Origin Stone puts unknown Mage secret entity 237 into SECRET; Deathwing (hero)
 * then attacks the Mage hero (~16:17:13). JAIL_315 must stay a valid helper option after
 * a hero attack. That secret later reveals as JAIL_315 when Murozond (TIME_024) attacks.
 */

export const HAND_PLAYED_MAGE_SECRET_ENTITY_ID = 95;
export const ORIGIN_STONE_MAGE_SECRET_ENTITY_ID = 237;

const PTL_PREFIX = 'PowerTaskList.DebugPrintPower()';
const END_TASK = 'PowerProcessor.EndCurrentTaskList()';

function indexOfFirst(lines: readonly string[], start: number, pred: (line: string) => boolean): number {
	for (let i = start; i < lines.length; i++) {
		if (pred(lines[i]!)) {
			return i;
		}
	}
	return -1;
}

/** First PTL line that moves entity 95 HAND → SECRET. */
export function findEntity95PtlSecretZoneIndex(lines: readonly string[]): number {
	return indexOfFirst(
		lines,
		0,
		(l) =>
			l.includes(PTL_PREFIX) &&
			l.includes(`id=${HAND_PLAYED_MAGE_SECRET_ENTITY_ID} zone=HAND`) &&
			l.includes('tag=ZONE value=SECRET'),
	);
}

/** First PTL line that moves entity 237 SETASIDE → SECRET. */
export function findEntity237PtlSecretZoneIndex(lines: readonly string[]): number {
	return indexOfFirst(
		lines,
		0,
		(l) =>
			l.includes(PTL_PREFIX) &&
			l.includes(`id=${ORIGIN_STONE_MAGE_SECRET_ENTITY_ID} zone=SETASIDE`) &&
			l.includes('tag=ZONE value=SECRET'),
	);
}

export type Entity95HungMarkers = {
	readonly ptlSecretZoneIndex: number;
	readonly endTaskListAfterSecretIndex: number;
	readonly minionAttackIndex: number;
	readonly explosiveRunesRevealIndex: number;
};

export function parseEntity95HungMarkers(lines: readonly string[]): Entity95HungMarkers {
	const ptlSecretZoneIndex = findEntity95PtlSecretZoneIndex(lines);
	if (ptlSecretZoneIndex < 0) {
		throw new Error('[mystic-misdirection] missing PTL ZONE=SECRET for entity 95');
	}
	const endTaskListAfterSecretIndex = indexOfFirst(lines, ptlSecretZoneIndex, (l) => l.includes(END_TASK));
	if (endTaskListAfterSecretIndex < 0) {
		throw new Error('[mystic-misdirection] missing EndCurrentTaskList after entity 95 ZONE=SECRET');
	}
	const minionAttackIndex = indexOfFirst(
		lines,
		endTaskListAfterSecretIndex,
		(l) =>
			l.includes('BLOCK_START BlockType=ATTACK') &&
			l.includes('id=33 zone=PLAY') &&
			l.includes('id=166 zone=PLAY'),
	);
	if (minionAttackIndex < 0) {
		throw new Error(
			'[mystic-misdirection] missing Genn (33) attack on Boneguard Commander (166) after entity 95 hung',
		);
	}
	const explosiveRunesRevealIndex = indexOfFirst(
		lines,
		minionAttackIndex,
		(l) => l.includes(`id=${HAND_PLAYED_MAGE_SECRET_ENTITY_ID} zone=SECRET`) && l.includes('CardID=CORE_LOOT_101'),
	);
	if (explosiveRunesRevealIndex < 0) {
		throw new Error('[mystic-misdirection] missing CORE_LOOT_101 reveal of entity 95');
	}
	if (!(ptlSecretZoneIndex < endTaskListAfterSecretIndex)) {
		throw new Error('[mystic-misdirection] EndCurrentTaskList must follow entity 95 ZONE=SECRET');
	}
	if (!(endTaskListAfterSecretIndex < minionAttackIndex)) {
		throw new Error('[mystic-misdirection] minion attack must come after entity 95 hung');
	}
	if (!(minionAttackIndex < explosiveRunesRevealIndex)) {
		throw new Error('[mystic-misdirection] Explosive Runes reveal must come after the minion attack');
	}
	return {
		ptlSecretZoneIndex,
		endTaskListAfterSecretIndex,
		minionAttackIndex,
		explosiveRunesRevealIndex,
	};
}

/** Prefix: entity 95 is in SECRET, no later attack / Explosive Runes reveal. */
export function slicePowerLogAfterEntity95Hung(lines: readonly string[]): string[] {
	const markers = parseEntity95HungMarkers(lines);
	return lines.slice(0, markers.endTaskListAfterSecretIndex + 1).filter((line) => line.length > 0);
}

export type Entity237HeroAttackMarkers = {
	readonly ptlSecretZoneIndex: number;
	readonly deathwingHeroAttackIndex: number;
	readonly endTaskListAfterHeroAttackIndex: number;
	readonly murozondAttackIndex: number;
};

export function parseEntity237HeroAttackMarkers(lines: readonly string[]): Entity237HeroAttackMarkers {
	const ptlSecretZoneIndex = findEntity237PtlSecretZoneIndex(lines);
	if (ptlSecretZoneIndex < 0) {
		throw new Error('[mystic-misdirection] missing PTL ZONE=SECRET for entity 237');
	}
	const deathwingHeroAttackIndex = indexOfFirst(
		lines,
		ptlSecretZoneIndex,
		(l) =>
			l.includes(PTL_PREFIX) &&
			l.includes('BLOCK_START BlockType=ATTACK') &&
			l.includes('id=68 zone=PLAY') &&
			l.includes('HERO_01bn') &&
			l.includes('id=70 zone=PLAY') &&
			l.includes('HERO_08ac'),
	);
	if (deathwingHeroAttackIndex < 0) {
		throw new Error('[mystic-misdirection] missing Deathwing hero attack on Mage hero after entity 237 hung');
	}
	const endTaskListAfterHeroAttackIndex = indexOfFirst(lines, deathwingHeroAttackIndex, (l) => l.includes(END_TASK));
	if (endTaskListAfterHeroAttackIndex < 0) {
		throw new Error('[mystic-misdirection] missing EndCurrentTaskList after Deathwing hero attack');
	}
	const murozondAttackIndex = indexOfFirst(
		lines,
		endTaskListAfterHeroAttackIndex,
		(l) => l.includes('BLOCK_START BlockType=ATTACK') && l.includes('id=23 zone=PLAY') && l.includes('TIME_024'),
	);
	if (murozondAttackIndex < 0) {
		throw new Error('[mystic-misdirection] missing Murozond (TIME_024) attack after Deathwing hero attack');
	}
	if (!(ptlSecretZoneIndex < deathwingHeroAttackIndex)) {
		throw new Error('[mystic-misdirection] Deathwing hero attack must follow entity 237 ZONE=SECRET');
	}
	if (!(deathwingHeroAttackIndex < endTaskListAfterHeroAttackIndex)) {
		throw new Error('[mystic-misdirection] EndCurrentTaskList must follow Deathwing hero attack');
	}
	if (!(endTaskListAfterHeroAttackIndex < murozondAttackIndex)) {
		throw new Error('[mystic-misdirection] Murozond attack must come after Deathwing hero-attack task list');
	}
	return {
		ptlSecretZoneIndex,
		deathwingHeroAttackIndex,
		endTaskListAfterHeroAttackIndex,
		murozondAttackIndex,
	};
}

/**
 * Prefix: entity 237 is in SECRET and Deathwing has already hero-attacked the Mage.
 * Stops before Murozond's minion attack (which reveals JAIL_315).
 */
export function slicePowerLogAfterEntity237HeroAttack(lines: readonly string[]): string[] {
	const markers = parseEntity237HeroAttackMarkers(lines);
	return lines.slice(0, markers.endTaskListAfterHeroAttackIndex + 1).filter((line) => line.length > 0);
}
