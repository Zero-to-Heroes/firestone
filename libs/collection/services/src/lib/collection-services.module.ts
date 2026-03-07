import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CollectionCommonModule } from '@firestone/collection/common';
import { CollectionDataAccessModule } from '@firestone/collection/data-access';
import { MemoryModule } from '@firestone/memory';
import { MercenariesCommonModule } from '@firestone/mercenaries/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { CardNotificationsService } from './services/card-notifications.service';
import { CardsMonitorService } from './services/cards-monitor.service';
import { CollectionManager } from './services/collection-manager.service';
import { CollectionStorageService } from './services/collection-storage.service';
import { SetsManagerService } from './services/sets-manager.service';
import { COLLECTION_MANAGER_SERVICE_TOKEN } from '@firestone/collection/common';

@NgModule({
	imports: [
		CommonModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		MemoryModule,
		CollectionCommonModule,
		CollectionDataAccessModule,
		MercenariesCommonModule,
	],
	providers: [
		CollectionManager,
		SetsManagerService,
		CollectionStorageService,
		CardsMonitorService,
		CardNotificationsService,
		{ provide: COLLECTION_MANAGER_SERVICE_TOKEN, useExisting: CollectionManager },
	],
})
export class CollectionServicesModule {}
