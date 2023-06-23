import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { LoadingStateComponent } from './components/loading-state.component';
import { WithLoadingComponent } from './components/with-loading.component';
import { FsTranslateDirective } from './localization/fs-translate.directive';
import { FsTranslatePipe } from './localization/fs-translate.pipe';
import { AnalyticsService } from './services/analytics/analytics.service';
import { ApiRunner } from './services/api-runner';
import { CardsFacadeStandaloneService } from './services/cards-facade-standalone.service';
import { CardsFacadeService } from './services/cards-facade.service';
import { DiskCacheService } from './services/disk-cache.service';
import { LocalStorageService } from './services/local-storage';
import { OverwolfService } from './services/overwolf.service';

const components = [FsTranslateDirective, FsTranslatePipe, WithLoadingComponent, LoadingStateComponent];

@NgModule({
	imports: [CommonModule, BrowserAnimationsModule, InlineSVGModule.forRoot(), SharedFrameworkCommonModule],
	providers: [
		AnalyticsService,
		ApiRunner,
		OverwolfService,
		CardsFacadeService,
		CardsFacadeStandaloneService,
		DiskCacheService,
		LocalStorageService,
	],
	declarations: components,
	exports: components,
})
export class SharedFrameworkCoreModule {}
