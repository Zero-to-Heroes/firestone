import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsHeroStat } from '../stats/bgs-hero-stat';

export class BgsHeroSelectionOverview implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-hero-selection-overview';
	readonly name: string = 'Hero Selection';
	readonly icon: string;
	readonly heroOverview: readonly BgsHeroStat[];
	readonly heroOptionCardIds: readonly string[];
	readonly patchNumber: number;

	public static create(base: BgsHeroSelectionOverview): BgsHeroSelectionOverview {
		return Object.assign(new BgsHeroSelectionOverview(), base);
	}
}
