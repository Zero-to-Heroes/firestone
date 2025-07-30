import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { CdkOverlayContainer } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
	PLAUSIBLE_DOMAIN,
	setAppInjector,
	SharedFrameworkCoreModule,
} from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ColiseumAppComponent } from './coliseum-app.component';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) => {
	const currentDate = new Date();
	const translationFileVersion = `${currentDate.getFullYear()}${currentDate.getMonth()}${currentDate.getDate()}`;
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		`.json?v=${translationFileVersion}`,
	);
};

@NgModule({
	imports: [
		CommonModule,
		BrowserModule,

		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: {
				provide: TranslateLoader,
				useFactory: httpLoaderFactory,
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
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		{ provide: PLAUSIBLE_DOMAIN, useValue: 'replays.firestoneapp.com' },
	],
	bootstrap: [ColiseumAppComponent],
})
export class AppModule {
	constructor(private readonly injector: Injector) {
		setAppInjector(injector);
	}
}
