import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BgsHeroPortraitComponent } from './common/bgs-hero-portrait.component';
import { BattlegroundsAnomaliesFilterDropdownViewComponent } from './filters/battlegrounds-anomalies-filter-dropdown-view.component';
import { BattlegroundsRankFilterDropdownViewComponent } from './filters/battlegrounds-rank-filter-dropdown-view.component';
import { BattlegroundsTimeFilterDropdownViewComponent } from './filters/battlegrounds-time-filter-dropdown-view.component';
import { BattlegroundsTribesFilterDropdownViewComponent } from './filters/battlegrounds-tribes-filter-dropdown-view.component';
import { BattlegroundsHeroAveragePositionDetailsTooltipComponent } from './meta-heroes/battlegrounds-hero-average-position-details-tooltip.component';
import { BattlegroundsMetaStatsHeroInfoComponent } from './meta-heroes/battlegrounds-meta-stats-hero-info.component';
import { BattlegroundsMetaStatsHeroTierComponent } from './meta-heroes/battlegrounds-meta-stats-hero-tier.component';
import { BattlegroundsMetaStatsHeroesViewComponent } from './meta-heroes/battlegrounds-meta-stats-heroes-view.component';
import { CircularProgressComponent } from './meta-heroes/circular-progress.component';
import { BattlegroundsMetaStatsQuestInfoComponent } from './meta-quests/battlegrounds-meta-stats-quest-info.component';
import { BattlegroundsMetaStatsQuestTierComponent } from './meta-quests/battlegrounds-meta-stats-quest-tier.component';
import { BattlegroundsMetaStatsQuestsViewComponent } from './meta-quests/battlegrounds-meta-stats-quests-view.component';
import { BattlegroundsMetaStatsQuestRewardInfoComponent } from './meta-quests/rewards/battlegrounds-meta-stats-quest-reward-info.component';
import { BattlegroundsMetaStatsQuestRewardTierComponent } from './meta-quests/rewards/battlegrounds-meta-stats-quest-reward-tier.component';
import { BattlegroundsMetaStatsQuestRewardsViewComponent } from './meta-quests/rewards/battlegrounds-meta-stats-quest-rewards-view.component';

const components = [
	BattlegroundsMetaStatsHeroesViewComponent,
	BattlegroundsMetaStatsHeroTierComponent,
	BattlegroundsMetaStatsHeroInfoComponent,
	BattlegroundsMetaStatsQuestsViewComponent,
	BattlegroundsMetaStatsQuestTierComponent,
	BattlegroundsMetaStatsQuestInfoComponent,
	BattlegroundsMetaStatsQuestRewardsViewComponent,
	BattlegroundsMetaStatsQuestRewardTierComponent,
	BattlegroundsMetaStatsQuestRewardInfoComponent,
	BattlegroundsHeroAveragePositionDetailsTooltipComponent,
	BgsHeroPortraitComponent,
	CircularProgressComponent,

	BattlegroundsRankFilterDropdownViewComponent,
	BattlegroundsTimeFilterDropdownViewComponent,
	BattlegroundsTribesFilterDropdownViewComponent,
	BattlegroundsAnomaliesFilterDropdownViewComponent,
];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule, InlineSVGModule.forRoot()],
	declarations: components,
	exports: components,
})
export class BattlegroundsViewModule {}
