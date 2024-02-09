import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { RankImageComponent } from './components/rank-image.component';
import { ReplayInfoGeneric2Component } from './components/replay-info-generic-2.component';
import { MatchAnalysisService } from './services/match-analysis.service';
import { ReplayMetadataBuilderService } from './services/replay-metadata-bulder.service';

const components = [ReplayInfoGeneric2Component, RankImageComponent];

@NgModule({
	imports: [
		CommonModule,

		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
	],
	providers: [ReplayMetadataBuilderService, MatchAnalysisService],
	declarations: components,
	exports: components,
})
export class StatsCommonModule {}
