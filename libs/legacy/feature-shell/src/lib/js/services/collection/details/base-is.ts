import { sleep } from '@firestone/shared/framework/common';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';

export abstract class AbstractCollectionInternalService<T, U = T> {
	public collection$$ = new BehaviorSubject<readonly T[]>([]);

	protected abstract type: () => string;
	protected abstract memoryInfoCountExtractor: (update: MemoryUpdate) => number;
	protected abstract memoryReadingOperation: () => Promise<readonly U[]>;
	protected abstract localDbRetrieveOperation: () => Promise<readonly T[]>;
	protected abstract localDbSaveOperation: (collection: readonly T[]) => Promise<any>;

	constructor(protected readonly events: Events) {
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
		// So that the protected methods are initialized in the child class
		await sleep(1);

		await this.preInit();
		const collectionUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			filter((event) => this.memoryInfoCountExtractor(event.data[0]) != null),
			map((event) => {
				const changes: MemoryUpdate = event.data[0];
				return this.memoryInfoCountExtractor(changes);
			}),
		);
		collectionUpdate$.pipe(debounceTime(5000), distinctUntilChanged()).subscribe(async (newCount) => {
			const collection = await this.memoryReadingOperation();
			if (!!collection?.length) {
				const updated = this.updateMemoryInfo(collection);
				console.debug(
					`[collection-manager] [${this.type()}] updating collection`,
					newCount,
					collection.length,
					updated.length,
				);
				this.collection$$.next(updated);
			}
		});
		this.collection$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
			console.debug(`[collection-manager] [${this.type()}] updating collection in db`, collection.length);
			await this.localDbSaveOperation(collection);
		});

		const collectionFromDb = await this.localDbRetrieveOperation();
		if (collectionFromDb?.length) {
			console.debug(`[collection-manager] [${this.type()}] init collection from db`, collectionFromDb.length);
			this.collection$$.next(collectionFromDb);
		}
		await this.postInit();
	}

	public async getCollection(): Promise<readonly T[]> {
		return this.collection$$.getValue();
	}
}
