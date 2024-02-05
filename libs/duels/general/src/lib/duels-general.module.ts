import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DuelsRewardComponent } from './component/duels-reward.component';
import { DuelsConfigService } from './services/duels-config.service';
import { DuelsNavigationService } from './services/duels-navigation.service';
import { DuelsPersonalDecksService } from './services/duels-personal-decks.service';

const components = [DuelsRewardComponent];

@NgModule({
	imports: [
		CommonModule,

		InlineSVGModule.forRoot(),

		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
	],
	providers: [DuelsConfigService, DuelsPersonalDecksService, DuelsNavigationService],
	declarations: components,
	exports: components,
})
export class DuelsGeneralModule {}
