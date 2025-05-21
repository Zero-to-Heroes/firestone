import { Injectable } from '@angular/core';
import { MemoryUpdatesService } from '@firestone/memory';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Injectable()
export class GameNativeStateStoreService extends AbstractFacadeService<GameNativeStateStoreService> {
	public isFriendsListOpen$$: BehaviorSubject<boolean>;

	private memoryUpdates: MemoryUpdatesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameNativeStateStoreService', () => !!this.isFriendsListOpen$$);
	}

	protected override assignSubjects() {
		this.isFriendsListOpen$$ = this.mainInstance.isFriendsListOpen$$;
	}

	protected async init() {
		this.isFriendsListOpen$$ = new BehaviorSubject<boolean>(false);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);

		this.memoryUpdates.memoryUpdates$$
			.pipe(
				map((changes) => !!changes?.isFriendsListOpen),
				distinctUntilChanged(),
			)
			.subscribe((isFriendsListOpen) => {
				this.isFriendsListOpen$$.next(isFriendsListOpen);
			});
	}
}
