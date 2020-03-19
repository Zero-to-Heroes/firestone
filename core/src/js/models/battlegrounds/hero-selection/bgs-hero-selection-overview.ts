import { BgsPanel } from '../bgs-panel';
import { BgsHeroOverview } from './bgs-hero-overview';

export class BgsHeroSelectionOverview implements BgsPanel {
	id = 'bgs_hero_selection_overview';
	name = 'Heroes Overview';
	icon: string;
	heroOverview: readonly BgsHeroOverview[];
}
