import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BattleStatusPremiumComponent } from './components/battle-status-premium.component';
import { BgsBattleStatusComponent } from './components/bgs-battle-status.component';
import { BgsCardTooltipComponent } from './components/bgs-card-tooltip.component';
import { CompositionDetectorService } from './services/compositions/composition-detector.service';
import { BgsBattleSimulationMockExecutorService } from './services/simulation/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './services/simulation/bgs-battle-simulation.service';
import { BgsIntermediateResultsSimGuardianService } from './services/simulation/bgs-intermediate-results-sim-guardian.service';

const components = [BgsCardTooltipComponent, BgsBattleStatusComponent, BattleStatusPremiumComponent];

@NgModule({
	imports: [
		CommonModule,

		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		BattlegroundsDataAccessModule,
		ReplayColiseumModule,
	],
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
