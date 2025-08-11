import { Race } from '@firestone-hs/reference-data';

export interface JsonEventsMetadata {
	readonly playerMmr: number;
	readonly playerHero: string;
	readonly playerFinishPosition: number;
	readonly patchNumber: number;
	readonly internalGameId: string;
	readonly availableTribes: readonly Race[];
	readonly hasPrizes: boolean;
	readonly prizesPicked: readonly string[];
}
