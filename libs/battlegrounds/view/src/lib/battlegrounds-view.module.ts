import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsHeroPortraitComponent } from './common/bgs-hero-portrait.component';
import { BattlegroundsMetaStatsHeroInfoComponent } from './meta-heroes/battlegrounds-meta-stats-hero-info.component';
import { BattlegroundsMetaStatsHeroTierComponent } from './meta-heroes/battlegrounds-meta-stats-hero-tier.component';

const components = [
	BattlegroundsMetaStatsHeroTierComponent,
	BattlegroundsMetaStatsHeroInfoComponent,
	BgsHeroPortraitComponent,
];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
})
export class BattlegroundsViewModule {}
