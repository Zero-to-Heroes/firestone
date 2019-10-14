import { RarityTYpe } from './rarity.type';
import { ReferencePlayerClass } from './reference-player-class';

export interface ReferenceCard {
	readonly id: string;
	readonly dbfId: number;
	readonly name: string;
	readonly set: string;
	readonly playerClass: ReferencePlayerClass;
	readonly cardClass: string;
	readonly cost?: number;
	readonly attack?: number;
	readonly health?: number;
	readonly audio: any[];
	readonly text: string;
	readonly flavor: string;
	readonly type: string;
	readonly mechanics: string[];
	readonly rarity?: RarityTYpe;
}
