import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule, Store, translationFileVersion } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
} from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebsiteLocalizationService } from './localization/website-localization.service';
import { WebsiteNavigationComponent } from './navigation/website-navigation.component';
import { WebsiteTopBarComponent } from './navigation/website-top-bar.component';
import { WebsitePreferencesService } from './preferences/website-preferences.service';
import { AuthenticationService } from './security/authentication.service';
import { WebsitePremiumComponent } from './security/website-premium.component';
import { WebsiteStoreService } from './store/website-store.service';
import { WebsiteBootstrapService } from './website-bootstrap.service';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import * as fromWebsiteCore from './+state/website/core.reducer';
import { WebsiteCoreEffects } from './+state/website/core.effects';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		!!translationFileVersion?.length ? `.json?v=${translationFileVersion}` : undefined,
	);
}

const components = [WebsiteNavigationComponent, WebsiteTopBarComponent, WebsitePremiumComponent];

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
