import { GameTag } from '@firestone-hs/reference-data';

export interface EntityTag {
	readonly index: number;
	readonly entity: number;
	readonly tag: GameTag;
	readonly value: number;
	readonly parentIndex: number;
}
