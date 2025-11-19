import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { MatchAnalysisService } from './services/match-analysis.service';
import { ReplayMetadataBuilderService } from './services/replay-metadata-bulder.service';

@NgModule({
	imports: [
		CommonModule,

		BattlegroundsCoreModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
	],
	providers: [ReplayMetadataBuilderService, MatchAnalysisService],
})
export class StatsServicesModule {}
