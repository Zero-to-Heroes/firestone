import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { DuelsMetaStatsTierCardInfoComponent } from './stats/duels-meta-stats-tier-card-info.component';
import { DuelsMetaStatsTierTierComponent } from './stats/duels-meta-stats-tier.component';
import { DuelsMetaStatsViewComponent } from './stats/duels-meta-stats-view.component';

const components = [DuelsMetaStatsViewComponent, DuelsMetaStatsTierTierComponent, DuelsMetaStatsTierCardInfoComponent];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
})
export class DuelsViewModule {}
