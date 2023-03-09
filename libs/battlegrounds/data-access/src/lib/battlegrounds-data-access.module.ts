import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
})
export class BattlegroundsDataAccessModule {}
