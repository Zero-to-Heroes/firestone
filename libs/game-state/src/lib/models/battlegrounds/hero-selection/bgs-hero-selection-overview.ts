import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';

export class BgsHeroSelectionOverviewPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-hero-selection-overview';
	readonly name: string;
	readonly icon: string;
	readonly heroOptions: readonly { entityId: number; cardId: string }[];
	readonly selectedHeroCardId: string;

	public static create(
		base: Partial<NonFunctionProperties<BgsHeroSelectionOverviewPanel>>,
	): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), base);
	}

	public update(base: Partial<NonFunctionProperties<BgsHeroSelectionOverviewPanel>>): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), this, base);
	}
}
