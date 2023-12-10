import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { GameStateUpdatesService } from './services/game-state-updates.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [GameStateUpdatesService],
})
export class GameStateModule {}
