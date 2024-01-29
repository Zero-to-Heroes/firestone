import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedArchetypeService } from './services/constructed-archetype.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
	providers: [ConstructedPersonalDecksService, ConstructedArchetypeService],
})
export class ConstructedCommonModule {}
