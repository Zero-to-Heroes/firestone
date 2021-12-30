import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { SharedFeatureOverwolfModule } from '@firestone/shared/feature/overwolf';
import { SharedFeaturePreferencesModule } from '@firestone/shared/feature/preferences';
import { NotificationsComponent } from './notifications.component';

@NgModule({
	imports: [
		CommonModule,
		SharedFeatureOverwolfModule,
		SharedFeaturePreferencesModule,
		SimpleNotificationsModule.forRoot(),
	],
	declarations: [NotificationsComponent],
	exports: [NotificationsComponent],
})
export class NotificationsFeatureShellModule {}
