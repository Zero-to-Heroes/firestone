import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
		SharedFrameworkCoreModule,
		WebsiteBootstrapModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
