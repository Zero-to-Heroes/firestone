import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, Injector } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { BattlegroundsServicesModule } from '@firestone/battlegrounds/services';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { CdkOverlayContainer, translationFileVersion } from '@firestone/shared/framework/common';
import {
	BrowserClipboardService,
	BrowserMonitorsService,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	CLIPBOARD_SERVICE_TOKEN,
	ILocalizationService,
	LocalizationStandaloneService,
	MONITORS_SERVICE_TOKEN,
	PLAUSIBLE_DOMAIN,
	setAppInjector,
	SharedFrameworkCoreModule,
} from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { routes } from './routes';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
	new TranslateHttpLoader(http, 'https://static.firestoneapp.com/data/i18n/', `.json?v=${translationFileVersion}`);

function provideAppInjectorInitializer() {
	return {
		provide: APP_INITIALIZER,
		useFactory: (injector: Injector) => () => setAppInjector(injector),
		deps: [Injector],
		multi: true,
	};
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideAppInjectorInitializer(),
		provideRouter(routes),
		provideHttpClient(),
		provideAnimations(),

		importProvidersFrom([
			TranslateModule.forRoot({
				defaultLanguage: 'enUS',
				loader: {
					provide: TranslateLoader,
					useFactory: httpLoaderFactory,
					deps: [HttpClient],
				},
			}),
			InlineSVGModule.forRoot(),
		]),

		importProvidersFrom(
			SharedFrameworkCoreModule,
			SharedCommonServiceModule,
			BattlegroundsCommonModule,
			BattlegroundsServicesModule,
		),

		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		{ provide: PLAUSIBLE_DOMAIN, useValue: 'www.firestoneapp.com' },
		{ provide: CLIPBOARD_SERVICE_TOKEN, useClass: BrowserClipboardService },
		{ provide: MONITORS_SERVICE_TOKEN, useClass: BrowserMonitorsService },

		// CdkOverlayContainer,
	],
};
