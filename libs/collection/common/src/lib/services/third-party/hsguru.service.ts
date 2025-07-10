/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { Card } from '@firestone/memory';
import { AccountService } from '@firestone/profile/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged, filter, map, pairwise, take } from 'rxjs';
import { COLLECTION_MANAGER_SERVICE_TOKEN, ICollectionManagerService } from '../collection-manager.interface';

const UPLOAD_URL = `https://api.hsguru.com/api/dt/collection`;

@Injectable()
export class HsGuruService extends AbstractFacadeService<HsGuruService> {
	private collectionManager: ICollectionManagerService;
	private api: ApiRunner;
	private prefs: PreferencesService;
	private account: AccountService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'HsGuruService', () => true);
	}

	protected override assignSubjects() {
		// Do nothing
	}

	protected async init() {
		console.debug('[hsguru] init');
		this.collectionManager = AppInjector.get(COLLECTION_MANAGER_SERVICE_TOKEN);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.account = AppInjector.get(AccountService);

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.hsGuruCollectionSync),
				filter((sync) => sync),
				distinctUntilChanged(),
				take(1),
			)
			.subscribe(() => {
				console.debug('[hsguru] activating collection sync');
				this.collectionManager.collection$$
					.pipe(debounceTime(20_000), distinctUntilChanged())
					.subscribe((collection) => {
						this.syncCollection(collection);
					});
			});

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.hsGuruCollectionSync),
				pairwise(),
			)
			.subscribe(async ([previous, current]) => {
				if (!previous && current) {
					console.debug('[hsguru] forcing collection sync');
					const collection = await this.collectionManager.collection$$.getValueWithInit();
					let synched = false;
					if (collection?.length > 0) {
						synched = await this.syncCollection(collection);
					}
					if (!synched) {
						console.warn('[hsguru] no collection to sync');
					}
				}
			});
	}

	private async syncCollection(collection: readonly Card[]): Promise<boolean> {
		const totalCards = collection
			.map((c) => (c.count ?? 0) + (c.premiumCount ?? 0) + (c.diamondCount ?? 0) + (c.signatureCount ?? 0))
			.reduce((a, b) => a + b, 0);
		console.log('[hsguru] will sync collection', totalCards);
		const region = await this.account.getRegion();
		console.log('[hsguru] region', region, collection);
		const accountInfo = await this.account.getAccountInfo();
		console.log('[hsguru] account info', accountInfo);
		if (!region || !accountInfo?.BattleTag) {
			console.warn('[hsguru] cannot sync collection, region or account info not available', region, accountInfo);
			return false;
		}

		const payload: Payload = {
			battleTag: accountInfo?.BattleTag,
			region: region,
			cards: collection,
		};
		console.debug('[hsguru] payload', payload);
		const uploadResult = await this.api.callPostApi(UPLOAD_URL, payload);
		console.log('[hsguru] collection uploaded', uploadResult);
		return true;
	}
}

interface Payload {
	readonly battleTag: string;
	readonly region: BnetRegion;
	readonly cards: readonly Card[];
}
