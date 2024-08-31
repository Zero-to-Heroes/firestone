import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsBattleStatusComponent } from './components/bgs-battle-status.component';
import { BgsCardTooltipComponent } from './components/bgs-card-tooltip.component';
import { BgsBattleSimulationMockExecutorService } from './services/simulation/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './services/simulation/bgs-battle-simulation.service';

const components = [BgsCardTooltipComponent, BgsBattleStatusComponent];

@NgModule({
	imports: [
		CommonModule,

		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		BattlegroundsDataAccessModule,
		ReplayColiseumModule,
	],
	providers: [BgsBattleSimulationMockExecutorService, BgsBattleSimulationService],
	declarations: components,
	exports: components,
})
export class BattlegroundsCoreModule {}
