import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDataAccessApiRunnerModule } from '@firestone/shared/data-access/api-runner';
import { SharedDataAccessStorageModule } from '@firestone/shared/data-access/storage';
import { SharedFeatureOverwolfModule } from '@firestone/shared/feature/overwolf';
import { PreferencesService } from './preferences.service';

@NgModule({
	imports: [
		CommonModule,
		SharedDataAccessApiRunnerModule,
		SharedDataAccessStorageModule,
		SharedFeatureOverwolfModule,
	],
	providers: [PreferencesService],
})
export class SharedFeaturePreferencesModule {}
