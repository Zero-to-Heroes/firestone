import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
	SharedFrameworkCoreModule,
} from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ColiseumAppComponent } from './coliseum-app.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	// The current date, in a yyyyMMdd format
	const currentDate = new Date();
	const translationFileVersion = `${currentDate.getFullYear()}${currentDate.getMonth()}${currentDate.getDate()}`;
	// const translationFileVersion = `${currentDate.getTime()}`;
	// Force a refresh every day, as we don't want to load a new version simply to update the translations
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		`.json?v=${translationFileVersion}`,
	);
}

@NgModule({
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

		ReplayColiseumModule,
		SharedFrameworkCoreModule,
	],
	declarations: [ColiseumAppComponent],
	providers: [
		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
	],
	bootstrap: [ColiseumAppComponent],
})
export class AppModule {}
