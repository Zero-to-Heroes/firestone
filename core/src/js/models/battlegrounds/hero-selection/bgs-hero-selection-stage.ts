import { BgsPanel } from '../bgs-panel';
import { BgsStage } from '../bgs-stage';

export class BgsHeroSelectionStage implements BgsStage {
	id: 'hero-selection';
	icon: null;
	name: 'Hero Selection';
	panels: readonly BgsPanel[];
}
