import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {
	CdkOverlayContainer,
	SharedFrameworkCommonModule,
	Store,
	translationFileVersion,
} from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
} from '@firestone/shared/framework/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebsiteCoreEffects } from './+state/website/core.effects';
import * as fromWebsiteCore from './+state/website/core.reducer';
import { WebsiteLocalizationService } from './localization/website-localization.service';
import { WebsitePreferencesService } from './preferences/website-preferences.service';
import { AuthenticationService } from './security/authentication.service';
import { WebsiteAuthComponent } from './security/website-auth.component';
import { WebsitePremiumComponent } from './security/website-premium.component';
import { WebsiteStoreService } from './store/website-store.service';
import { WebsiteBootstrapService } from './website-bootstrap.service';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		!!translationFileVersion?.length ? `.json?v=${translationFileVersion}` : undefined,
	);
}

const components = [WebsitePremiumComponent, WebsiteAuthComponent];

@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,

		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		InlineSVGModule.forRoot(),

		SharedFrameworkCommonModule,

		StoreModule.forFeature(fromWebsiteCore.WEBSITE_CORE_FEATURE_KEY, fromWebsiteCore.websiteCoreReducer),

		EffectsModule.forFeature([WebsiteCoreEffects]),
	],
	providers: [
		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: WebsiteLocalizationService },
		{ provide: Store, useExisting: WebsiteStoreService },
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },

		WebsiteBootstrapService,
		WebsitePreferencesService,
		WebsiteLocalizationService,
		WebsiteStoreService,

		AuthenticationService,
	],
	declarations: components,
	exports: components,
})
export class WebsiteBootstrapModule {}
