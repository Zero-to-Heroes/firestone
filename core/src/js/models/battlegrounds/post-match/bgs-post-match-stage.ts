import { BgsPanel } from '../bgs-panel';
import { BgsStage } from '../bgs-stage';
import { BgsStageId } from '../bgs-stage-id.type';

export class BgsPostMatchStage implements BgsStage {
	readonly id: BgsStageId = 'post-match';
	readonly icon: null;
	readonly name: string = 'Post-match stats';
	readonly panels: readonly BgsPanel[];

	public static create(base: BgsPostMatchStage): BgsPostMatchStage {
		return Object.assign(new BgsPostMatchStage(), base);
	}

	public update(base: BgsPostMatchStage): BgsPostMatchStage {
		return Object.assign(new BgsPostMatchStage(), this, base);
	}
}
