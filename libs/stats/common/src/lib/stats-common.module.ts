import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ReplayMetadataBuilderService } from './services/replay-metadata-bulder.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
	providers: [ReplayMetadataBuilderService],
})
export class StatsCommonModule {}
