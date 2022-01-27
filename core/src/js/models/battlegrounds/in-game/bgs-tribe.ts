import { Race } from '@firestone-hs/reference-data';

export interface BgsTribe {
	readonly turn: number;
	// Even though we have the full detailed info in the memory, we only show what is available in the UI
	readonly dominantTribe: Race;
	readonly count: number;
}
