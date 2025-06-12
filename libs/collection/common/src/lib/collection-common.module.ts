import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CollectionNavigationService } from './services/collection-navigation.service';
import { HearthpwnService } from './services/third-party/hearthpwn.service';
import { HsGuruService } from './services/third-party/hsguru.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule, MemoryModule, ProfileCommonModule],
	providers: [CollectionNavigationService, HearthpwnService, HsGuruService],
})
export class CollectionCommonModule {}
