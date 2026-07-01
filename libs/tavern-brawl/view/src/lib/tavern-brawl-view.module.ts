import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CollectionServicesModule } from '@firestone/collection/services';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { ConstructedViewModule } from '@firestone/constructed/view';
import { DecktrackerCommonModule } from '@firestone/decktracker/common';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { TavernBrawlCommonModule } from '@firestone/tavern-brawl/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { TavernBrawlMetaDecksComponent } from './components/meta/tavern-brawl-meta-decks.component';
import { TavernBrawlOverviewComponent } from './components/overview/tavern-brawl-overview.component';
import { TavernBrawlPersonalDecksComponent } from './components/personal-decks/tavern-brawl-personal-decks.component';
import { TavernBrawlStatComponent } from './components/stat/tavern-brawl-stat.component';
import { TavernBrawlDesktopComponent } from './components/tavern-brawl-desktop.component';

const components = [
	TavernBrawlDesktopComponent,
	TavernBrawlMetaDecksComponent,
	TavernBrawlOverviewComponent,
	TavernBrawlPersonalDecksComponent,
	TavernBrawlStatComponent,
];

@NgModule({
	imports: [
		CommonModule,
		InlineSVGModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		ConstructedCommonModule,
		ConstructedViewModule,
		DecktrackerCommonModule,
		CollectionServicesModule,
		MemoryModule,
		GameStateModule,
		TavernBrawlCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TavernBrawlViewModule {}
