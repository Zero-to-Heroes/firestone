import { MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs';
import { Events } from '../../events.service';

const THROTTLE_TIME = 30_000;

export abstract class AbstractCollectionInternalService<T, U = T> {
	public collection$$ = new SubscriberAwareBehaviorSubject<readonly T[]>(null);

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
			console.log('[collection-manager] init', this.type());
			// console.debug('[collection-manager] init', this.type(), new Error().stack);
			// await this.scene.isReady();

			// So that the protected methods are initialized in the child class
			// await sleep(1);
			await this.preInit();
			// Listen to memory updates
			const collectionUpdate$ = this.memoryUpdates.memoryUpdates$$.pipe(
				filter((changes) => this.memoryInfoCountExtractor(changes) != null),
				tap((changes) => console.debug(`[collection-manager] [${this.type()}] changes`, this.type(), changes)),
				map((changes) => {
					return this.memoryInfoCountExtractor(changes);
				}),
				tap((changes) => console.log(`[collection-manager] [${this.type()}] changes 2`, this.type(), changes)),
				distinctUntilChanged(),
			);
			collectionUpdate$.pipe(debounceTime(5000)).subscribe(async (newCount) => {
				const inGame = await this.gameStatus.inGame$$.getValueWithInit();
				console.debug(`[collection-manager] [${this.type()}] in game?`, inGame);
				if (!inGame) {
					return;
				}

				const collection = await this.memoryReadingOperation();
				console.debug(`[collection-manager] [${this.type()}] collection?`, collection);
				if (!this.isMemoryInfoEmpty(collection)) {
					this.performMemoryUpdate(collection);
				}
			});

			// Initial memory reading
			this.gameStatus.inGame$$
				.pipe(
					filter((inGame) => inGame),
					tap(() => console.log(`[collection-manager] [${this.type()}] in game`)),
					switchMap(() => this.memoryReadingOperation()),
					filter((collection) => !this.isMemoryInfoEmpty(collection)),
					take(1),
				)
				.subscribe(async (collection) => {
					console.log(`[collection-manager] [${this.type()}] initial collection`, collection?.length);
					await this.performMemoryUpdate(collection);
				});

			this.collection$$.pipe(filter((collection) => !!collection?.length)).subscribe(async (collection) => {
				console.log(`[collection-manager] [${this.type()}] updating collection in db`, collection?.length);
				await this.localDbSaveOperation(collection);
			});

			const collectionFromDb = await this.localDbRetrieveOperation();
			console.log(`[collection-manager] [${this.type()}] init collection from db`, collectionFromDb?.length);
			if (collectionFromDb?.length) {
				this.collection$$.next(collectionFromDb);
			}
			await this.postInit();
		});
	}

	private async performMemoryUpdate(collection: readonly U[]) {
		const updated = this.updateMemoryInfo(collection);
		console.log(
			`[collection-manager] [${this.type()}] updating collection`,
			collection?.length,
			updated?.length,
			updated?.length > 0 ? updated[0] : null,
		);
		this.collection$$.next(updated);
	}
}
