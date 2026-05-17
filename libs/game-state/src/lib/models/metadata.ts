import { GameFormat, GameType } from '@firestone-hs/reference-data';

/** Arena run with two playable classes (hero portrait + hero power class). */
export const DUAL_CLASS_ARENA_SCENARIO_ID = 5505;

export class Metadata {
	readonly gameType: GameType;
	readonly formatType: GameFormat;
	readonly scenarioId: number;
}
