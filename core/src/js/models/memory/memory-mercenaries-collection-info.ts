import { TaskStatus } from '@firestone-hs/reference-data';
import { MemoryMercenary } from './memory-mercenaries-info';

export interface MemoryMercenariesCollectionInfo {
	readonly Mercenaries: readonly MemoryMercenary[];
	readonly Visitors: readonly MemoryVisitor[];
}

export interface MemoryVisitor {
	readonly VisitorId: number;
	readonly TaskId: number;
	readonly TaskChainProgress: number;
	readonly TaskProgress: number;
	readonly Status: TaskStatus;
}
