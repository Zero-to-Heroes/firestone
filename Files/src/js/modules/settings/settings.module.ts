import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SharedModule } from '../shared/shared.module';
import { SettingsComponent } from '../../components/settings/settings.component';
import { DebugService } from '../../services/debug.service';
import { SettingsAppSelectionComponent } from '../../components/settings/settings-app-selection.component';
import { SettingsAchievementsComponent } from '../../components/settings/settings-achievements.component';
import { SettingsAchievementsMenuComponent } from '../../components/settings/settings-achievements-menu.component';
import { SettingsAchievementsCaptureComponent } from '../../components/settings/settings-achievements-capture.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverwolfService } from '../../services/overwolf.service';
import { SettingsAchievementsVideoCaptureComponent } from '../../components/settings/settings-achievements-video-capture.component';
import { SettingsAchievementsSoundCaptureComponent } from '../../components/settings/settings-achievements-sound-capture.component';
import { SettingsAchievementsStorageComponent } from '../../components/settings/settings-achievements-storage.component';

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
	],
	bootstrap: [
		SettingsComponent,
	],
	providers: [
		DebugService,
		OverwolfService,
	],
})

export class SettingsModule { }
