import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { SharedFrameworkCommonModule, Store, translationFileVersion } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebsiteBattlegroundsComponent } from './battlegrounds/website-battlegrounds.component';
import { WebsiteLocalizationService } from './localization/website-localization.service';
import { WebsiteNavigationComponent } from './navigation/website-navigation.component';
import { WebsiteTopBarComponent } from './navigation/website-top-bar.component';
import { WebsitePreferencesService } from './preferences/website-preferences.service';
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

const components = [WebsiteBattlegroundsComponent, WebsiteNavigationComponent, WebsiteTopBarComponent];

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
		BattlegroundsDataAccessModule,
	],
	providers: [
		{ provide: CardsFacadeService, useClass: AllCardsService },
		{ provide: ILocalizationService, useClass: WebsiteLocalizationService },
		{ provide: Store, useClass: WebsiteStoreService },

		WebsiteBootstrapService,
		WebsitePreferencesService,
	],
	declarations: components,
	exports: components,
})
export class WebsiteBootstrapModule {}
