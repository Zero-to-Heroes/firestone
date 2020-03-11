import { BgsStage } from './bgs-stage';
import { BgsStageId } from './bgs-stage-id.type';

export class BattlegroundsState {
	stages: readonly BgsStage[];
	currentStageId: BgsStageId;
}
