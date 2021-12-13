import { EventEmitter, Injectable } from '@angular/core';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { MercenariesCollectionInformationFromMemoryEvent } from '../mainwindow/store/events/mercenaries/mercenaries-collection-information-from-memory-event';
import { MercenariesMapInformationFromMemoryEvent } from '../mainwindow/store/events/mercenaries/mercenaries-map-information-from-memory-event';
import { OverwolfService } from '../overwolf.service';
import { MercenariesMemoryCacheService } from './mercenaries-memory-cache.service';

@Injectable()
export class MercenariesMemoryUpdateService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly memoryCache: MercenariesMemoryCacheService) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});

		this.memoryCache.memoryCollectionInfo$.subscribe((info) => {
			this.stateUpdater.next(new MercenariesCollectionInformationFromMemoryEvent(info));
		});
		this.memoryCache.memoryMapInfo$.subscribe((info) => {
			this.stateUpdater.next(new MercenariesMapInformationFromMemoryEvent(info));
		});
	}
}
