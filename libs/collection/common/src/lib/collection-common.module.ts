import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CollectionNavigationService } from './services/collection-navigation.service';
import { HearthpwnService } from './services/third-party/hearthpwn.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule, MemoryModule],
	providers: [CollectionNavigationService, HearthpwnService],
})
export class CollectionCommonModule {}
