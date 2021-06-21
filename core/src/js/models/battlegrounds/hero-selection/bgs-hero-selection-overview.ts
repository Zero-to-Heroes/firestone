import { VisualAchievement } from '../../visual-achievement';
import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsHeroStat } from '../stats/bgs-hero-stat';
import { BgsStats } from '../stats/bgs-stats';

export class BgsHeroSelectionOverviewPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-hero-selection-overview';
	readonly name: string = 'Hero Selection';
	readonly icon: string;
	readonly heroOverview: readonly BgsHeroStat[];
	readonly heroOptionCardIds: readonly string[];
	readonly selectedHeroCardId: string;
	readonly patchNumber: number;
	readonly globalStats: BgsStats;
	readonly heroAchievements: readonly VisualAchievement[];

	public static create(base: BgsHeroSelectionOverviewPanel): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), base);
	}

	public update(base: BgsHeroSelectionOverviewPanel): BgsHeroSelectionOverviewPanel {
		return Object.assign(new BgsHeroSelectionOverviewPanel(), this, base);
	}
}
