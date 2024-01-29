import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedArchetypeService } from './services/constructed-archetype.service';
import { ConstructedNavigationService } from './services/constructed-navigation.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';
import { GameStateFacadeService } from './services/game-state-facade.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
	providers: [
		ConstructedPersonalDecksService,
		ConstructedArchetypeService,
		GameStateFacadeService,
		ConstructedNavigationService,
	],
})
export class ConstructedCommonModule {}
