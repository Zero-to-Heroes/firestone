import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { BattlegroundsSimulatorModule, BgsBattlePositioningExecutorService } from '@firestone/battlegrounds/simulator';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { CardsFacadeService, SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AppBoostrapperComponent } from './app-bootstrap.component';
import { BgsBattlePositioningWorkerService } from './impl/bgs-battle-positioning-worker.service';
import { BgsBattleSimulationWorkerService } from './impl/bgs-battle-simulation-worker.service';

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
	],
	bootstrap: [AppBoostrapperComponent],
})
export class AppModule {}
