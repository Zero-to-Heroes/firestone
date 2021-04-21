import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { OutOfCardsCallbackComponent } from '../../components/third-party/out-of-cards-callback.component';
import { ApiRunner } from '../../services/api-runner';
import { DebugService } from '../../services/debug.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OutOfCardsService } from '../../services/mainwindow/out-of-cards.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [BrowserModule, HttpClientModule, 
		SharedServicesModule.forRoot(),],
	declarations: [OutOfCardsCallbackComponent],
	bootstrap: [OutOfCardsCallbackComponent],
	providers: [
		DebugService,
		PreferencesService,
		GenericIndexedDbService,
		OverwolfService,
		ApiRunner,
		OutOfCardsService,
	],
})
export class OutOfCardsCallbackModule {}
