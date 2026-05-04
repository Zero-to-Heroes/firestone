import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { GameStatsProviderService } from './services/game-stats-provider.service';
import { MatchAnalysisService } from './services/match-analysis.service';
import { ReplayMetadataBuilderService } from './services/replay-metadata-builder.service';

@NgModule({
	imports: [
		CommonModule,

		BattlegroundsCoreModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
	],
	providers: [ReplayMetadataBuilderService, MatchAnalysisService, GameStatsProviderService],
})
export class StatsServicesModule {}
