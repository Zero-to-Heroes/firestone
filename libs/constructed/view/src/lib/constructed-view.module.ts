import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppCommonModule } from '@firestone/app/common';
import { CollectionServicesModule } from '@firestone/collection/services';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { VirtualScrollerModule } from '@sebastientromp/ngx-virtual-scroller';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ConstructedCardOptionViewComponent } from './components/constructed-card-option-view.component';
import { ConstructedMetaDeckSummaryComponent } from './components/meta-decks/constructed-meta-deck-summary.component';
import { ConstructedDustFilterDropdownComponent } from './components/meta-decks/filters/constructed-dust-filter-dropdown.component';
import { ConstructedPlayerClassFilterDropdownComponent } from './components/meta-decks/filters/constructed-player-class-filter-dropdown.component';
import { ConstructedSampleSizeFilterDropdownComponent } from './components/meta-decks/filters/constructed-sample-size-filter-dropdown.component';
import { MetaDecksVisualizationComponent } from './components/meta-decks/meta-decks-visualization.component';
import { ConstructedMulliganDeckComponent } from './components/constructed-mulligan-deck.component';
import { ConstructedMulliganHandComponent } from './components/constructed-mulligan-hand.component';
import { MulliganDeckGuideArchetypeSelectionDropdownComponent } from './components/mulligan-deck-guide-archetype-selection.component';
import { MulliganDeckViewArchetypeComponent } from './components/mulligan-deck-view-archetype.component';
import { MulliganDeckViewComponent } from './components/mulligan-deck-view.component';
import { MulliganHandViewComponent } from './components/mulligan-hand-view.component';
import { MulliganInfoPremiumComponent } from './components/mulligan-info-premium.component';

const components = [
	MetaDecksVisualizationComponent,
	ConstructedMetaDeckSummaryComponent,
	ConstructedPlayerClassFilterDropdownComponent,
	ConstructedSampleSizeFilterDropdownComponent,
	ConstructedDustFilterDropdownComponent,
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
		VirtualScrollerModule,

		StatsDataAccessModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		ConstructedCommonModule,
		CollectionServicesModule,
		MemoryModule,
		GameStateModule,
		AppCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [],
})
export class ConstructedViewModule {}
