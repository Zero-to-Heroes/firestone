import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppCommonModule } from '@firestone/app/common';
import { AppServicesModule } from '@firestone/app/services';
import { ConstructedCommonModule } from '@firestone/constructed/common';
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

		InlineSVGModule,

		StatsDataAccessModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		ConstructedCommonModule,
		MemoryModule,
		GameStateModule,
		AppCommonModule,
		AppServicesModule,
	],
	declarations: components,
	exports: components,
	providers: [],
})
export class ConstructedViewModule {}
