import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { FsTranslateDirective } from './localization/fs-translate.directive';
import { FsTranslatePipe } from './localization/fs-translate.pipe';
import { LocalizationStandaloneService } from './localization/localization-standalone.service';
import { AnalyticsService } from './services/analytics/analytics.service';
import { ApiRunner } from './services/api-runner';
import { CardRulesService } from './services/card-rules.service';
import { CardsFacadeStandaloneService } from './services/cards-facade-standalone.service';
import { DATABASE_SERVICE_TOKEN } from './services/database-service.interface';
import { IndexedDbService } from './services/indexeddb.service';
import { LocalStorageService } from './services/local-storage';
import { OverwolfService } from './services/overwolf.service';
import { OwUtilsService } from './services/ow-utils.service';
import { UserService } from './services/user.service';
import { WindowManagerService } from './services/window-manager.service';

const components = [FsTranslateDirective, FsTranslatePipe];

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule],
	providers: [
		AnalyticsService,
		ApiRunner,
		OverwolfService,
		CardsFacadeStandaloneService,
		CardRulesService,
		LocalStorageService,
		WindowManagerService,
		LocalizationStandaloneService,
		UserService,
		OwUtilsService,
		OverwolfService,
		IndexedDbService,
		{ provide: DATABASE_SERVICE_TOKEN, useExisting: IndexedDbService },
	],
	declarations: components,
	exports: components,
})
export class SharedFrameworkCoreModule {}
