import { BgsPanel } from '../bgs-panel';
import { BgsHeroOverview } from './bgs-hero-overview';

export class BgsHeroSelectionOverview implements BgsPanel {
	id: string = 'bgs_hero_selection_overview';
	name: string = 'Heroes Overview';
	icon: string;
	heroOverview: readonly BgsHeroOverview[];
}
