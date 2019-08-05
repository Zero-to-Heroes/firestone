import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TwitchAuthCallbackComponent } from '../../components/twitch-auth/twitch-auth-callback.component';
import { DebugService } from '../../services/debug.service';
import { PreferencesService } from '../../services/preferences.service';
import { HttpClientModule } from '@angular/common/http';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OverwolfService } from '../../services/overwolf.service';

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [BrowserModule, HttpClientModule],
	declarations: [TwitchAuthCallbackComponent],
	bootstrap: [TwitchAuthCallbackComponent],
	providers: [DebugService, PreferencesService, GenericIndexedDbService, OverwolfService],
})
export class TwitchAuthCallbackModule {}
