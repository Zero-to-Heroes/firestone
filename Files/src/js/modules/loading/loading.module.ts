import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SharedModule } from '../shared/shared.module';

import { LoadingComponent } from '../../components/loading/loading.component';

import { DebugService } from '../../services/debug.service';
import { FeatureFlags } from '../../services/feature-flags.service';
import { init } from '@sentry/browser';
import { AdService } from '../../services/ad.service';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
		SharedModule,
	],
	declarations: [
		LoadingComponent,
	],
	bootstrap: [
		LoadingComponent,
	],
	providers: [
		DebugService,
		FeatureFlags,
        AdService,
	],
})

export class LoadingModule { }
