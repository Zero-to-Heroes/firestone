import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
	providers: [ConstructedPersonalDecksService],
})
export class ConstructedCommonModule {}
