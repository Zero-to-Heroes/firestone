import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedMulliganDeckComponent } from './components/constructed-mulligan-deck.component';
import { ConstructedMulliganHandComponent } from './components/constructed-mulligan-hand.component';
import { MulliganInfoPremiumComponent } from './components/mulligan-info-premium.component';
import { ConstructedArchetypeService } from './services/constructed-archetype.service';
import { ConstructedMetaDecksStateService } from './services/constructed-meta-decks-state-builder.service';
import { ConstructedMulliganGuideGuardianService } from './services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from './services/constructed-mulligan-guide.service';
import { ConstructedNavigationService } from './services/constructed-navigation.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';

const components = [ConstructedMulliganHandComponent, ConstructedMulliganDeckComponent, MulliganInfoPremiumComponent];

@NgModule({
	imports: [
		CommonModule,
		StatsDataAccessModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
	],
	declarations: components,
	exports: components,
	providers: [
		ConstructedPersonalDecksService,
		ConstructedArchetypeService,
		ConstructedNavigationService,
		ConstructedMetaDecksStateService,
		ConstructedMulliganGuideService,
		ConstructedMulliganGuideGuardianService,
	],
})
export class ConstructedCommonModule {}
