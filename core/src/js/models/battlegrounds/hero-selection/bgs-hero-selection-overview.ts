import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsHeroOverview } from './bgs-hero-overview';

export class BgsHeroSelectionOverview implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-hero-selection-overview';
	readonly name: string = 'Hero Selection';
	readonly icon: string;
	readonly heroOverview: readonly BgsHeroOverview[];
	readonly heroOptionCardIds: readonly string[];

	public static create(base: BgsHeroSelectionOverview): BgsHeroSelectionOverview {
		return Object.assign(new BgsHeroSelectionOverview(), base);
	}
}
