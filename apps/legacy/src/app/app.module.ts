import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { ModsModule } from '@firestone/mods';
import { BgsBattlePositioningExecutorService } from '../../../../libs/legacy/feature-shell/src/lib/js/services/battlegrounds/bgs-battle-positioning-executor.service';
import { BgsBattleSimulationExecutorService } from '../../../../libs/legacy/feature-shell/src/lib/js/services/battlegrounds/bgs-battle-simulation-executor.service';
import { AppBoostrapperComponent } from './app-bootstrap.component';
import { BgsBattlePositioningWorkerService } from './impl/bgs-battle-positioning-worker.service';
import { BgsBattleSimulationWorkerService } from './impl/bgs-battle-simulation-worker.service';

@NgModule({
	declarations: [AppBoostrapperComponent],
	imports: [BrowserModule, LegacyFeatureShellModule, ModsModule],
	providers: [
		{ provide: BgsBattleSimulationExecutorService, useClass: BgsBattleSimulationWorkerService },
		{ provide: BgsBattlePositioningExecutorService, useClass: BgsBattlePositioningWorkerService },
	],
	bootstrap: [AppBoostrapperComponent],
})
export class AppModule {}
