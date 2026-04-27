import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_VERSION_SERVICE_TOKEN } from '@firestone/app/common';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import {
	BattlegroundsSimulatorModule,
	BgsBattlePositioningExecutorService,
	BgsBattlePositioningWorkerService,
	BgsBattleSimulationWorkerService,
} from '@firestone/battlegrounds/simulator';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import {
	LOG_FILE_BACKEND,
	OverwolfLogFileBackendService,
	SharedCommonServiceModule,
} from '@firestone/shared/common/service';
import { CardsFacadeService, SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AppBoostrapperComponent } from './app-bootstrap.component';
import { OwAppVersionService } from './impl/ow-app-version.service';

@NgModule({
	declarations: [AppBoostrapperComponent],
	imports: [
		BrowserModule,
		LegacyFeatureShellModule,
		SharedFrameworkCoreModule,
		SharedCommonServiceModule,
		BattlegroundsSimulatorModule,
	],
	providers: [
		CardsFacadeService,
		{ provide: BgsBattleSimulationExecutorService, useClass: BgsBattleSimulationWorkerService },
		{ provide: BgsBattlePositioningExecutorService, useClass: BgsBattlePositioningWorkerService },
		{
			provide: LOG_FILE_BACKEND,
			useClass: OverwolfLogFileBackendService,
		},
		{ provide: APP_VERSION_SERVICE_TOKEN, useClass: OwAppVersionService },
	],
	bootstrap: [AppBoostrapperComponent],
})
export class AppModule {}
