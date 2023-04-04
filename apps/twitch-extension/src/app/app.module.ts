import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LocalizationStandaloneService } from '@components/decktracker/overlay/twitch/localization-standalone.service';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { Store } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
} from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@legacy-import/src/lib/js/services/decktracker/card-highlight/cards-highlight-facade.service';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';

import { AppComponent } from './app.component';
import { TwitchStoreService } from './twitch-store.service';

@NgModule({
	declarations: [AppComponent],
	imports: [BrowserModule, LegacyFeatureShellModule],
	providers: [
		CardsFacadeStandaloneService,
		LocalizationStandaloneService,
		TwitchStoreService,

		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
		{ provide: LocalizationFacadeService, useExisting: LocalizationStandaloneService },
		{ provide: AppUiStoreFacadeService, useExisting: TwitchStoreService },
		// { provide: Store, useFactory: () => null },
		{ provide: Store, useExisting: TwitchStoreService },
		{ provide: CardsHighlightFacadeService, useFactory: () => null },
		// For coliseum-components
		{ provide: AllCardsService, useExisting: CardsFacadeStandaloneService },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
