import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BugReportService } from './services/bug-report.service';
import { GameStatusService } from './services/game-status.service';
import { LogUtilsService } from './services/log-utils.service';
import { LogsUploaderService } from './services/logs-uploader.service';
import { OwNotificationsService } from './services/notifications.service';
import { PatchesConfigService } from './services/patches-config.service';
import { SimpleIOService } from './services/plugins/simple-io.service';
import { PreferencesStorageService } from './services/preferences-storage.service';
import { PreferencesService } from './services/preferences.service';
import { S3FileUploadService } from './services/s3-file-upload.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule],
	providers: [
		PreferencesService,
		PreferencesStorageService,
		GameStatusService,
		OwNotificationsService,
		PatchesConfigService,
		LogUtilsService,
		S3FileUploadService,
		SimpleIOService,
		LogsUploaderService,
		BugReportService,
	],
})
export class SharedCommonServiceModule {}
