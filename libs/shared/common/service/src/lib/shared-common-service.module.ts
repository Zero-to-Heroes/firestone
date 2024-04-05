import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { GameStatusService } from './services/game-status.service';
import { OwNotificationsService } from './services/notifications.service';
import { PatchesConfigService } from './services/patches-config.service';
import { PreferencesStorageService } from './services/preferences-storage.service';
import { PreferencesService } from './services/preferences.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule],
	providers: [
		PreferencesService,
		PreferencesStorageService,
		GameStatusService,
		OwNotificationsService,
		PatchesConfigService,
	],
})
export class SharedCommonServiceModule {}
