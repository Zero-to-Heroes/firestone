import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { GameStatusService } from './services/game-status.service';
import { LogUtilsService } from './services/log-utils.service';
import { OwNotificationsService } from './services/notifications.service';
import { PatchesConfigService } from './services/patches-config.service';
import { PreferencesStorageService } from './services/preferences-storage.service';
import { PreferencesService } from './services/preferences.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule],
	providers: [
		PreferencesService,
		PreferencesStorageService,
		GameStatusService,
		OwNotificationsService,
		PatchesConfigService,
		LogUtilsService,
	],
})
export class SharedCommonServiceModule {}
