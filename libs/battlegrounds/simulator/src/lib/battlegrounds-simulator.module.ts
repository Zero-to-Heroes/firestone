import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsSimulatorComponent } from './components/bgs-simulator.component';
import { BgsBattleSimulationMockExecutorService } from './services/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './services/bgs-battle-simulation.service';

const components = [BgsSimulatorComponent];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule],
	providers: [BgsBattleSimulationMockExecutorService, BgsBattleSimulationService],
	declarations: components,
	exports: components,
})
export class BattlegroundsSimulatorModule {}
