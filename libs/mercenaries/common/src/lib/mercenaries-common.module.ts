import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { MercenariesMemoryCacheService } from './services/mercenaries-memory-cache.service';
import { MercenariesNavigationService } from './services/mercenaries-navigation.service';

@NgModule({
	imports: [
		CommonModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		MemoryModule,
	],
	providers: [MercenariesNavigationService, MercenariesMemoryCacheService],
})
export class MercenariesCommonModule {}
