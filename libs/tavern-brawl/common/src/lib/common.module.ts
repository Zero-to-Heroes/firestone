import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { TavernBrawlService } from './services/tavern-brawl.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule],
	providers: [TavernBrawlService],
})
export class TavernBrawlCommonModule {}
