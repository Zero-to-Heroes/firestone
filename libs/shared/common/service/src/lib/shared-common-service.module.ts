import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AdvancedSettingDirective } from './directives/advanced-setting.directive';
import { BugReportService } from './services/bug-report.service';
import { DiskCacheService } from './services/disk-cache.service';
import { ExpertContributorsService } from './services/expert-contributors.service';
import { GameStatusService } from './services/game-status.service';
import { LogUtilsService } from './services/log-utils.service';
import { LogsUploaderService } from './services/logs-uploader.service';
import { OwNotificationsService } from './services/notifications.service';
import { PatchesConfigService } from './services/patches-config.service';
import { SimpleIOService } from './services/plugins/simple-io.service';
import { PreferencesStorageService } from './services/preferences-storage.service';
import { PreferencesService } from './services/preferences.service';
import { S3FileUploadService } from './services/s3-file-upload.service';
import { OwLegacyPremiumService } from './services/subscription/ow-legacy-premium.service';
import { SubscriptionService } from './services/subscription/subscription.service';
import { TebexService } from './services/subscription/tebex.service';

const components = [AdvancedSettingDirective];

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
		ExpertContributorsService,
		DiskCacheService,
		SubscriptionService,
		TebexService,
		OwLegacyPremiumService,
	],
	declarations: components,
	exports: components,
})
export class SharedCommonServiceModule {}
