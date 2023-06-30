import { Injectable } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject } from 'rxjs';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { CollectionManager } from '../../collection/collection-manager.service';
import { Events } from '../../events.service';

@Injectable()
export class CollectionBootstrapService {
	public packStats$$ = new BehaviorSubject<readonly PackResult[]>([]);

	constructor(private readonly events: Events, private readonly collectionManager: CollectionManager) {
		this.init();
		window['collectionBootstrap'] = this;
	}

	public newPack(pack: PackResult) {
		const currentStats = this.packStats$$.value;
		this.packStats$$.next([pack, ...currentStats]);
	}

	private async init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.CollectionInit) {
				this.initCollectionState();
			}
		});

		this.initCollectionState();
	}

	private async initCollectionState(): Promise<void> {
		console.log('initializing collection state');
		const packStats = await this.collectionManager.getPackStats();
		this.packStats$$.next(packStats);
	}
}
