import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';

export class BgsHeroSelectionOverviewPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-hero-selection-overview';
	readonly name: string;
	readonly icon: string;
	readonly heroOptionCardIds: readonly string[];
	readonly selectedHeroCardId: string;

	public static create(base: BgsHeroSelectionOverviewPanel): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), base);
	}

	public update(base: BgsHeroSelectionOverviewPanel): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), this, base);
	}
}
