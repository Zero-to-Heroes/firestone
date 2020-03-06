import { BgsPlayerEntity } from './bgs-player-entity';
import { BoardEntity } from './board-entity';

export interface BgsBoardInfo {
	readonly player: BgsPlayerEntity;
	readonly board: readonly BoardEntity[];
}
