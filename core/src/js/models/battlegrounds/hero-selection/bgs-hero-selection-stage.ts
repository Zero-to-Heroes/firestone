import { BgsPanel } from '../bgs-panel';
import { BgsStage } from '../bgs-stage';
import { BgsStageId } from '../bgs-stage-id.type';

export class BgsHeroSelectionStage implements BgsStage {
	readonly id: BgsStageId = 'hero-selection';
	readonly icon: null;
	readonly name: string = 'Hero Selection';
	readonly panels: readonly BgsPanel[];

	public static create(base: BgsHeroSelectionStage): BgsHeroSelectionStage {
		return Object.assign(new BgsHeroSelectionStage(), base);
	}
}
