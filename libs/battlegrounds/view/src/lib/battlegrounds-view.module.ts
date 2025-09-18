import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BattlegroundsEmptyStateComponent } from './common/battlegrounds-empty-state.component';
import { BgsHeroPortraitComponent } from './common/bgs-hero-portrait.component';
import { BattlegroundsAnomaliesFilterDropdownViewComponent } from './filters/battlegrounds-anomalies-filter-dropdown-view.component';
import { BattlegroundsRankFilterDropdownViewComponent } from './filters/battlegrounds-rank-filter-dropdown-view.component';
import { BattlegroundsTimeFilterDropdownViewComponent } from './filters/battlegrounds-time-filter-dropdown-view.component';
import { BattlegroundsTribesFilterDropdownViewComponent } from './filters/battlegrounds-tribes-filter-dropdown-view.component';
import { BattlegroundsCompositionDetailsModalComponent } from './meta-comps/battlegrounds-composition-details-modal.component';
import { BattlegroundsMetaStatsCompInfoComponent } from './meta-comps/battlegrounds-meta-stats-comps-info.component';
import { BattlegroundsMetaStatsCompTierComponent } from './meta-comps/battlegrounds-meta-stats-comps-tier.component';
import { BattlegroundsMetaStatsCompsViewComponent } from './meta-comps/battlegrounds-meta-stats-comps-view.component';
import { BattlegroundsHeroAveragePositionDetailsTooltipComponent } from './meta-heroes/battlegrounds-hero-average-position-details-tooltip.component';
import { BattlegroundsHeroSearchComponent } from './meta-heroes/battlegrounds-hero-search.component';
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
import { BattlegroundsMetaStatsTrinketInfoComponent } from './meta-trinkets/battlegrounds-meta-stats-trinket-info.component';
import { BattlegroundsMetaStatsTrinketTierComponent } from './meta-trinkets/battlegrounds-meta-stats-trinket-tier.component';
import { BattlegroundsMetaStatsTrinketsViewComponent } from './meta-trinkets/battlegrounds-meta-stats-trinkets-view.component';
import { BgsActionCountWidgetWrapperComponent } from './overlay/bgs-action-count-widget-wrapper.component';
import { ActionCountComponent } from './overlay/bgs-action-count.component';
import { BattlegroundsDesktopYourStatsComponent } from './personal-stats/battlegrounds-desktop-your-stats.component';
import { BattlegroundsPersonalStatsInfoComponent } from './personal-stats/battlegrounds-personal-stats-info.component';

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
	BattlegroundsMetaStatsCompsViewComponent,
	BattlegroundsMetaStatsCompTierComponent,
	BattlegroundsMetaStatsCompInfoComponent,
	BattlegroundsCompositionDetailsModalComponent,
	BattlegroundsHeroAveragePositionDetailsTooltipComponent,
	BattlegroundsHeroSearchComponent,
	BattlegroundsMetaStatsTrinketsViewComponent,
	BattlegroundsMetaStatsTrinketTierComponent,
	BattlegroundsMetaStatsTrinketInfoComponent,
	BattlegroundsDesktopYourStatsComponent,
	BattlegroundsPersonalStatsInfoComponent,
	BgsHeroPortraitComponent,

	BgsActionCountWidgetWrapperComponent,
	ActionCountComponent,

	CircularProgressComponent,
	BattlegroundsEmptyStateComponent,

	BattlegroundsRankFilterDropdownViewComponent,
	BattlegroundsTimeFilterDropdownViewComponent,
	BattlegroundsTribesFilterDropdownViewComponent,
	BattlegroundsAnomaliesFilterDropdownViewComponent,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		DragDropModule,

		ReplayColiseumModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		BattlegroundsCoreModule,
		InlineSVGModule,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsViewModule {}
