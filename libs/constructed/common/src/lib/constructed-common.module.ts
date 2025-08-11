import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedDiscoverService } from './services/constructed-discover.service';
import { ConstructedDiscoversGuardianService } from './services/constructed-discovers-guardian.service';
import { ConstructedMetaDecksStateService } from './services/constructed-meta-decks-state-builder.service';
import { ConstructedMulliganGuideGuardianService } from './services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from './services/constructed-mulligan-guide.service';
import { ConstructedNavigationService } from './services/constructed-navigation.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';

@NgModule({
	imports: [
		CommonModule,

		StatsDataAccessModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
	],
	providers: [
		ConstructedPersonalDecksService,
		ConstructedNavigationService,
		ConstructedMetaDecksStateService,
		ConstructedMulliganGuideService,
		ConstructedDiscoverService,
		ConstructedMulliganGuideGuardianService,
		ConstructedDiscoversGuardianService,
	],
})
export class ConstructedCommonModule {}
