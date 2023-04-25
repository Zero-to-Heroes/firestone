import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBattlegroundsModule } from '@firestone/website/battlegrounds';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { WebsiteDuelsModule } from '@firestone/website/duels';
import { WebsiteProfileModule } from '@firestone/website/profile';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AuthGuard } from './auth-guard.service';
import { PremiumRedirectGuard } from './premium-redirect.service';

@NgModule({
	declarations: [AppComponent],
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

		SharedFrameworkCoreModule,
		WebsiteBootstrapModule,
		WebsiteBattlegroundsModule,
		WebsiteDuelsModule,
		WebsiteProfileModule,
	],
	providers: [AuthGuard, PremiumRedirectGuard],
	bootstrap: [AppComponent],
})
export class AppModule {}
