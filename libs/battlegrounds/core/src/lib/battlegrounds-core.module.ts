import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CompositionDetectorService } from './services/compositions/composition-detector.service';
import { BgsBattleSimulationMockExecutorService } from './services/simulation/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './services/simulation/bgs-battle-simulation.service';
import { BgsIntermediateResultsSimGuardianService } from './services/simulation/bgs-intermediate-results-sim-guardian.service';

const components = [];

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule, BattlegroundsDataAccessModule],
	providers: [
		BgsBattleSimulationMockExecutorService,
		BgsBattleSimulationService,
		BgsIntermediateResultsSimGuardianService,
		CompositionDetectorService,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsCoreModule {}
