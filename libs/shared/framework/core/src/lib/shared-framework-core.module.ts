import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { CardsFacadeService } from './services/cards-facade.service';
import { DiskCacheService } from './services/disk-cache.service';
import { LocalStorageService } from './services/local-storage';
import { OverwolfService } from './services/overwolf.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule],
	providers: [OverwolfService, CardsFacadeService, DiskCacheService, LocalStorageService],
})
export class SharedFrameworkCoreModule {}
