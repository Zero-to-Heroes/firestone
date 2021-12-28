import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedFeatureOverwolfModule } from '@core/../libs/shared/feature/overwolf/src';
import { AllCardsService } from '@firestone-hs/reference-data';
import { init } from '@sentry/browser';
import { AngularResizedEventModule } from 'angular-resize-event';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BgsSimulationOverlayStandaloneComponent } from '../../components/decktracker/overlay/twitch/bgs-simulation-overlay-standalone.component';
import { CardsFacadeStandaloneService } from '../../components/decktracker/overlay/twitch/cards-facade-standalone.service';
import { DeckTrackerOverlayContainerComponent } from '../../components/decktracker/overlay/twitch/decktracker-overlay-container.component.ts';
import { DeckTrackerOverlayStandaloneComponent } from '../../components/decktracker/overlay/twitch/decktracker-overlay-standalone.component';
import { DeckTrackerTwitchTitleBarComponent } from '../../components/decktracker/overlay/twitch/decktracker-twitch-title-bar.component';
import { EmptyCardComponent } from '../../components/decktracker/overlay/twitch/empty-card.component';
import { LocalizationStandaloneService } from '../../components/decktracker/overlay/twitch/localization-standalone.service';
import { StateMouseOverComponent } from '../../components/decktracker/overlay/twitch/state-mouse-over.component';
import { TwitchBgsHeroOverviewComponent } from '../../components/decktracker/overlay/twitch/twitch-bgs-hero-overview.component';
import { BgsBattleSimulationService } from '../../services/battlegrounds/bgs-battle-simulation.service';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { CardsHighlightService } from '../../services/decktracker/card-highlight/cards-highlight.service';
import { Events } from '../../services/events.service';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://8513431ee4344eb3b6626df27552c70e@sentry.io/1532694', // Different project for the extension
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is', process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		FormsModule,
		ReactiveFormsModule,
		SharedDeckTrackerModule,
		DragDropModule,
		AngularResizedEventModule,
		SharedFeatureOverwolfModule,
	],
	declarations: [
		DeckTrackerOverlayStandaloneComponent,
		DeckTrackerOverlayContainerComponent,
		DeckTrackerTwitchTitleBarComponent,
		BgsSimulationOverlayStandaloneComponent,
		EmptyCardComponent,
		StateMouseOverComponent,
	],
	entryComponents: [TwitchBgsHeroOverviewComponent, BgsCardTooltipComponent],
	bootstrap: [DeckTrackerOverlayContainerComponent],
	providers: [
		Events,
		AllCardsService,
		BgsBattleSimulationService,
		LocalizationStandaloneService,
		CardsFacadeStandaloneService,
		LocalStorageService,
		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: LocalizationFacadeService, useExisting: LocalizationStandaloneService },
		{ provide: AppUiStoreFacadeService, useFactory: () => null },
		{ provide: CardsHighlightService, useFactory: () => null },
	],
})
export class DeckTrackerTwitchModule {}
