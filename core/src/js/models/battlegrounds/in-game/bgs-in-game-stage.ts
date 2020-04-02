import { BgsPanel } from '../bgs-panel';
import { BgsStage } from '../bgs-stage';
import { BgsStageId } from '../bgs-stage-id.type';

export class BgsInGameStage implements BgsStage {
	readonly id: BgsStageId = 'in-game';
	readonly icon: null;
	readonly name: string = 'In Game';
	readonly panels: readonly BgsPanel[];

	public static create(base: BgsInGameStage): BgsInGameStage {
		return Object.assign(new BgsInGameStage(), base);
	}
}
