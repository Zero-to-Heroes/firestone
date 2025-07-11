import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppCommonModule } from '@firestone/app/common';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ConstructedCardOptionViewComponent } from './components/constructed-card-option-view.component';
import { ConstructedMulliganDeckComponent } from './components/constructed-mulligan-deck.component';
import { ConstructedMulliganHandComponent } from './components/constructed-mulligan-hand.component';
import { MulliganDeckGuideArchetypeSelectionDropdownComponent } from './components/mulligan-deck-guide-archetype-selection.component';
import { MulliganDeckViewArchetypeComponent } from './components/mulligan-deck-view-archetype.component';
import { MulliganDeckViewComponent } from './components/mulligan-deck-view.component';
import { MulliganHandViewComponent } from './components/mulligan-hand-view.component';
import { MulliganInfoPremiumComponent } from './components/mulligan-info-premium.component';
import { ConstructedArchetypeService } from './services/constructed-archetype.service';
import { ConstructedDiscoverService } from './services/constructed-discover.service';
import { ConstructedDiscoversGuardianService } from './services/constructed-discovers-guardian.service';
import { ConstructedMetaDecksStateService } from './services/constructed-meta-decks-state-builder.service';
import { ConstructedMulliganGuideGuardianService } from './services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from './services/constructed-mulligan-guide.service';
import { ConstructedNavigationService } from './services/constructed-navigation.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';

const components = [
	ConstructedMulliganHandComponent,
	ConstructedMulliganDeckComponent,
	ConstructedCardOptionViewComponent,
	MulliganInfoPremiumComponent,
	MulliganHandViewComponent,
	MulliganDeckViewComponent,
	MulliganDeckViewArchetypeComponent,
	MulliganDeckGuideArchetypeSelectionDropdownComponent,
];

@NgModule({
	imports: [
		CommonModule,

		InlineSVGModule.forRoot(),

		StatsDataAccessModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
		AppCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [
		ConstructedPersonalDecksService,
		ConstructedArchetypeService,
		ConstructedNavigationService,
		ConstructedMetaDecksStateService,
		ConstructedMulliganGuideService,
		ConstructedDiscoverService,
		ConstructedMulliganGuideGuardianService,
		ConstructedDiscoversGuardianService,
	],
})
export class ConstructedCommonModule {}
