import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { CdkOverlayContainer, translationFileVersion } from '@firestone/shared/framework/common';
import { PLAUSIBLE_DOMAIN } from '@firestone/shared/framework/core';

import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
	SharedFrameworkCoreModule,
} from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { routes } from './routes';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
	new TranslateHttpLoader(http, 'https://static.firestoneapp.com/data/i18n/', `.json?v=${translationFileVersion}`);

export const appConfig: ApplicationConfig = {
	providers: [
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

		importProvidersFrom(SharedFrameworkCoreModule, SharedCommonServiceModule, BattlegroundsCommonModule),

		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		{ provide: PLAUSIBLE_DOMAIN, useValue: 'www.firestoneapp.com' },

		// CdkOverlayContainer,
	],
};
