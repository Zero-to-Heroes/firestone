import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { PackStatsService } from './services/pack-stats.service';
import { SetsService } from './services/sets-service.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedCommonServiceModule],
	providers: [SetsService, PackStatsService],
})
export class CollectionDataAccessModule {}
