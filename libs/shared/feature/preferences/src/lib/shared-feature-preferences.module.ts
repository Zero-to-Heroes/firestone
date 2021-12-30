import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferencesService } from './preferences.service';

@NgModule({
	imports: [CommonModule],
	providers: [PreferencesService],
})
export class SharedFeaturePreferencesModule {}
