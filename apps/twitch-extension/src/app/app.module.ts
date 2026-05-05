import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CardsHighlightStandaloneService } from '@components/decktracker/overlay/twitch/cards-highlight-standalone.service';
import { TwitchCardsHighlightFacadeService } from '@components/decktracker/overlay/twitch/twitch-cards-highlight-facade.service';
import { CardsHighlightFacadeService } from '@firestone/game-state';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { AllCardsService } from '@firestone/replay/replay-parser';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
} from '@firestone/shared/framework/core';
import { TwitchCommonModule, TwitchPreferencesService } from '@firestone/twitch/common';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app.component';

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
	// The current date, in a yyyyMMdd format
	const currentDate = new Date();
	const translationFileVersion = `${currentDate.getFullYear()}${currentDate.getMonth()}${currentDate.getDate()}`;
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		`.json?v=${translationFileVersion}`,
	);
}

@NgModule({
	declarations: [AppComponent],
	imports: [
		CommonModule,
		BrowserModule,

		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),

		LegacyFeatureShellModule,
		TwitchCommonModule,
	],
	providers: [
		CardsHighlightStandaloneService,
		TwitchCardsHighlightFacadeService,

		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
		{ provide: LocalizationFacadeService, useExisting: LocalizationStandaloneService },
		{ provide: CardsHighlightFacadeService, useExisting: TwitchCardsHighlightFacadeService },
		{ provide: PreferencesService, useExisting: TwitchPreferencesService },
		// For coliseum-components
		{ provide: AllCardsService, useExisting: CardsFacadeStandaloneService },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
