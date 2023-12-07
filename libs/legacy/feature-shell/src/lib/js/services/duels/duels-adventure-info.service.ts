/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { AdventuresInfo } from '@models/memory/memory-duels';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { distinctUntilChanged, filter } from 'rxjs';

@Injectable()
// In fact it looks like this is not used yet
export class DuelsAdventureInfoService {
	public duelsAdventureInfo$$ = new SubscriberAwareBehaviorSubject<AdventuresInfo>(null);

	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly localStorage: LocalStorageService,
		private readonly gameStatus: GameStatusService,
	) {
		window['duelsAdventureInfo'] = this;
		this.init();
	}

	private async init(): Promise<void> {
		this.duelsAdventureInfo$$.onFirstSubscribe(async () => {
			console.debug('[duels-adventure-info] init');
			const localInfo = this.localStorage.getItem<AdventuresInfo>(
				LocalStorageService.LOCAL_STORAGE_ADVENTURES_INFO,
			);
			if (localInfo) {
				this.duelsAdventureInfo$$.next(localInfo);
			}

			this.gameStatus.inGame$$
				.pipe(
					filter((inGame) => inGame),
					distinctUntilChanged(),
				)
				.subscribe(async () => {
					console.debug('[duels-adventure-info] in game, fetching info');
					const info = await this.memory.getAdventuresInfo();
					if (info) {
						this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_ADVENTURES_INFO, info);
						this.duelsAdventureInfo$$.next(info);
					}
				});
		});
	}
}
