import { MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs';
import { Events } from '@firestone/shared/common/service';

export abstract class AbstractCollectionInternalService<T, U = T> {
	public collection$$ = new SubscriberAwareBehaviorSubject<readonly T[]>(null as unknown as readonly T[]);

	protected abstract type: () => string;
	protected abstract memoryInfoCountExtractor: (update: MemoryUpdate) => number;
	protected abstract memoryReadingOperation: () => Promise<readonly U[]>;
	protected abstract isMemoryInfoEmpty: (collection: readonly U[]) => boolean;
	protected abstract localDbRetrieveOperation: () => Promise<readonly T[]>;
	protected abstract localDbSaveOperation: (collection: readonly T[]) => Promise<any>;

	constructor(
		protected readonly events: Events,
		protected readonly scene: SceneService,
		protected readonly memoryUpdates: MemoryUpdatesService,
		protected readonly gameStatus: GameStatusService,
	) {
		this.init();
	}

	protected preInit(): void | Promise<void> {
		// Do nothing
	}
	protected postInit(): void | Promise<void> {
		// Do nothing
	}

	protected updateMemoryInfo(collection: readonly U[]): readonly T[] {
		return collection as any;
	}

	private async init() {
		this.collection$$.onFirstSubscribe(async () => {
			await this.preInit();
			const collectionUpdate$ = this.memoryUpdates.memoryUpdates$$.pipe(
				filter((changes) => this.memoryInfoCountExtractor(changes) != null),
				tap((changes) => console.debug(`[collection-manager] [${this.type()}] changes`, this.type(), changes)),
				map((changes) => this.memoryInfoCountExtractor(changes)),
				distinctUntilChanged(),
			);
			collectionUpdate$.pipe(debounceTime(5000)).subscribe(async (newCount) => {
				const inGame = await this.gameStatus.inGame$$.getValueWithInit();
				if (!inGame) return;
				const collection = await this.memoryReadingOperation();
				if (!this.isMemoryInfoEmpty(collection)) {
					this.performMemoryUpdate(collection);
				}
			});

			this.gameStatus.inGame$$
				.pipe(
					filter((inGame): inGame is boolean => inGame === true),
					switchMap(() => this.memoryReadingOperation()),
					filter((collection) => !this.isMemoryInfoEmpty(collection)),
					take(1),
				)
				.subscribe(async (collection) => {
					await this.performMemoryUpdate(collection);
				});

			this.collection$$.pipe(filter((collection) => !!collection?.length)).subscribe(async (collection) => {
				if (collection) await this.localDbSaveOperation(collection);
			});

			const collectionFromDb = await this.localDbRetrieveOperation();
			if (collectionFromDb?.length) {
				this.collection$$.next(collectionFromDb);
			}
			await this.postInit();
		});
	}

	private async performMemoryUpdate(collection: readonly U[]) {
		const updated = this.updateMemoryInfo(collection);
		this.collection$$.next(updated);
	}
}
