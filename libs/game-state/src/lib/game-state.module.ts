import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameStateUpdatesService } from './services/game-state-updates.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule],
	providers: [GameStateUpdatesService, GameStateFacadeService],
})
export class GameStateModule {}
