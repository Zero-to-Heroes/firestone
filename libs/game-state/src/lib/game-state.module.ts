import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameStateUpdatesService } from './services/game-state-updates.service';
import { GameUniqueIdService } from './services/game-unique-id.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule],
	providers: [
		BootstrapGameStateService,
		GameStateUpdatesService,
		GameStateFacadeService,
		GameUniqueIdService,
		GameEventsFacadeService,
	],
})
export class GameStateModule {}
