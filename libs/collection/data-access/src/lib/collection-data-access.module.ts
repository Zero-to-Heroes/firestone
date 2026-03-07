import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { SetsService } from './services/sets-service.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [SetsService],
})
export class CollectionDataAccessModule {}
