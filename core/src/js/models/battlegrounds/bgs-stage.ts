import { BgsPanel } from './bgs-panel';
import { BgsStageId } from './bgs-stage-id.type';

export interface BgsStage {
	readonly id: BgsStageId;
	readonly icon: string;
	readonly name: string;
	readonly panels: readonly BgsPanel[];
}
