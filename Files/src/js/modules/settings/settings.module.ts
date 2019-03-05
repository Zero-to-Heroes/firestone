import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SharedModule } from '../shared/shared.module';
import { SettingsComponent } from '../../components/settings/settings.component';
import { DebugService } from '../../services/debug.service';
import { SettingsAppSelectionComponent } from '../../components/settings/settings-app-selection.component';
import { SettingsAchievementsComponent } from '../../components/settings/achievements/settings-achievements.component';
import { SettingsAchievementsMenuComponent } from '../../components/settings/achievements/settings-achievements-menu.component';
import { SettingsAchievementsCaptureComponent } from '../../components/settings/achievements/settings-achievements-capture.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverwolfService } from '../../services/overwolf.service';
import { SettingsAchievementsVideoCaptureComponent } from '../../components/settings/achievements/settings-achievements-video-capture.component';
import { SettingsAchievementsSoundCaptureComponent } from '../../components/settings/achievements/settings-achievements-sound-capture.component';
import { SettingsAchievementsStorageComponent } from '../../components/settings/achievements/settings-achievements-storage.component';
import { PreferencesService } from '../../services/preferences.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { SettingsModalComponent } from '../../components/settings/modal/settings-modal.component';
import { Events } from '../../services/events.service';
import { ModalVideoSettingsChangedComponent } from '../../components/settings/modal/modal-video-settings-changed.component';
import { SettingsDecktrackerComponent } from '../../components/settings/decktracker/settings-decktracker.component';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
	],
	declarations: [
		SettingsComponent,
		SettingsAppSelectionComponent,

		SettingsAchievementsComponent,
		SettingsAchievementsMenuComponent,
		SettingsAchievementsCaptureComponent,
		SettingsAchievementsVideoCaptureComponent,
		SettingsAchievementsSoundCaptureComponent,
		SettingsAchievementsStorageComponent,
		SettingsModalComponent,
		ModalVideoSettingsChangedComponent,
		
		SettingsDecktrackerComponent,
	],
	bootstrap: [
		SettingsComponent,
	],
	providers: [
		DebugService,
		Events,
		GenericIndexedDbService,
		OverwolfService,
		PreferencesService,
	],
})

export class SettingsModule { }
