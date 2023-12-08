import { TaskStatus } from '@firestone-hs/reference-data';
import { MemoryMercenary } from './memory-mercenaries-info';

export interface MemoryMercenariesCollectionInfo {
	readonly Mercenaries: readonly MemoryMercenary[];
	readonly Teams: readonly MemoryTeam[];
	readonly Visitors: readonly MemoryVisitor[];
}

export interface MemoryTeam {
	readonly Id: number;
	readonly Name: string;
	readonly Mercenaries: readonly MemoryMercenary[];
}

export interface MemoryVisitor {
	readonly VisitorId: number;
	readonly TaskId: number;
	readonly TaskChainProgress: number;
	readonly TaskProgress: number;
	readonly Status: TaskStatus;
	readonly ProceduralMercenaryId: number;
	readonly ProceduralBountyId: number;
	readonly AdditionalMercenaryIds: readonly number[];
}
