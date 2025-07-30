import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameStateModule } from '@firestone/game-state';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { MarkdownModule } from 'ngx-markdown';
import { NewVersionNotificationComponent } from './components/new-version-notification.component';
import { PremiumDesktopComponent } from './premium/premium-desktop.component';
import { PremiumPackageComponent } from './premium/premium-package.component';
import { GameNativeStateStoreService } from './services/game-native-state-store.service';
import { LocalizationLoaderWithCache } from './services/localization-loader.service';
import { HsLogsWatcherService } from './services/logs/hs-logs-watcher.service';

const components = [NewVersionNotificationComponent, PremiumDesktopComponent, PremiumPackageComponent];
@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,

		InlineSVGModule,
		MarkdownModule.forRoot({ loader: HttpClient }),

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		GameStateModule,
		ProfileCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [LocalizationLoaderWithCache, HsLogsWatcherService, GameNativeStateStoreService],
})
export class AppCommonModule {}
