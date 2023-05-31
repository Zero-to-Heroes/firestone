import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBattlegroundsModule } from '@firestone/website/battlegrounds';
import {
	WebsiteBootstrapModule,
	WebsiteNavigationComponent,
	WebsiteNavigationNodeComponent,
	WebsiteTopBarComponent,
} from '@firestone/website/core';
import { WebsiteDuelsModule } from '@firestone/website/duels';
import { WebsiteProfileModule } from '@firestone/website/profile';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AuthGuard } from './auth-guard.service';
import { PremiumRedirectGuard } from './premium-redirect.service';

const components = [AppComponent, WebsiteNavigationComponent, WebsiteNavigationNodeComponent, WebsiteTopBarComponent];

@NgModule({
	declarations: components,
	imports: [
		BrowserModule,
		RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),

		StoreModule.forRoot(
			{},
			{
				metaReducers: [],
				runtimeChecks: {
					strictActionImmutability: true,
					strictStateImmutability: true,
				},
			},
		),
		EffectsModule.forRoot([]),
		StoreRouterConnectingModule.forRoot(),
		StoreDevtoolsModule.instrument({}),
		InlineSVGModule.forRoot(),

		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		WebsiteProfileModule,
		WebsiteBootstrapModule,
		WebsiteBattlegroundsModule,
		WebsiteDuelsModule,
	],
	providers: [AuthGuard, PremiumRedirectGuard],
	bootstrap: [AppComponent],
})
export class AppModule {}
