import { GameFormat, GameType } from '@firestone-hs/reference-data';

export class Metadata {
	readonly gameType: GameType;
	readonly formatType: GameFormat;
	readonly scenarioId: number;
}
