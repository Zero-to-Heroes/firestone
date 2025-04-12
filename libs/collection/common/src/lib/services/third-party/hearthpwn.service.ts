/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { Injectable } from '@angular/core';
import { Card } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { COLLECTION_MANAGER_SERVICE_TOKEN, ICollectionManagerService } from '../collection-manager.interface';

const PROFILE_UPLOAD_URL = `https://www.hearthpwn.com/client/upload`;

@Injectable()
export class HearthpwnService extends AbstractFacadeService<HearthpwnService> {
	private collectionManager: ICollectionManagerService;
	private api: ApiRunner;
	private prefs: PreferencesService;

	private cipherBridge: StringCipherBridge;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'HearthpwnService', () => true);
	}

	protected override assignSubjects() {
		// Do nothing
	}

	protected async init() {
		return;
		console.debug('[hearthpwn] init');
		this.collectionManager = AppInjector.get(COLLECTION_MANAGER_SERVICE_TOKEN);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.cipherBridge = new StringCipherBridge();
		this.cipherBridge.initialize();
		console.debug('[hearthpwn] init done');

		this.prefs.preferences$$
			.pipe(
				map((prefs) => true || prefs.hearthpwnSync),
				filter((sync) => sync),
				distinctUntilChanged(),
				take(1),
			)
			.subscribe((activeSub) => {
				console.debug('[hearthpwn] activating hearthpwn sync');
				this.collectionManager.collection$$
					.pipe(debounceTime(10000), distinctUntilChanged())
					.subscribe(async (collection) => {
						console.debug('[hearthpwn] will sync collection', collection);
						const uploadData: UploadData = await this.transformCollection(collection);
						console.debug('[hearthpwn] uploadData', uploadData);
						const encryptedUser = await this.encrypt(JSON.stringify(uploadData.User));
						const encryptedData = await this.encrypt(JSON.stringify(uploadData));
						console.debug('[hearthpwn] encrypted', encryptedUser);
						const payload = {
							user: encryptedUser,
							data: encryptedData,
						};
						console.debug('[hearthpwn] upload data', payload);
						const uploadResult = await this.api.callPostApi(PROFILE_UPLOAD_URL, payload);
						console.debug('[hearthpwn] upload result', uploadResult);
					});
			});
	}

	private async encrypt(data: string): Promise<string | null> {
		return this.cipherBridge.encrypt(data);
	}

	private async decrypt(data: string | null): Promise<string | null> {
		return this.cipherBridge.decrypt(data);
	}

	private async transformCollection(memoryCollection: readonly Card[]): Promise<UploadData> {
		const prefs = await this.prefs.getPreferences();
		const userId = prefs.hearthpwnUserId ?? 100569059;
		const authToken = prefs.hearthpwnAuthToken ?? '2AF39CB9-8CF1-4962-91F0-F400BA8CE0C5';
		const profile: UploadUser = {
			AuthToken: authToken,
			UserId: userId,
			Preferences: {},
		};
		const cards = memoryCollection.flatMap((c) => [
			{
				Name: c.id,
				Count: c.count ?? 0,
				IsPremium: false,
			},
			{
				Name: c.id,
				Count: c.premiumCount ?? 0,
				IsPremium: true,
			},
		]);
		const result: UploadData = {
			Cards: cards,
			User: profile,
			Status: UploadStatus.Processing,
			Profile: {},
			Rank: {},
			Decks: [],
		};
		return result;
	}
}

interface UploadData {
	readonly User: UploadUser;
	readonly Cards: readonly UploadCard[];
	readonly Status: UploadStatus;
	readonly Profile: UploadProfile;
	readonly Rank: UploadRank;
	readonly Decks: readonly UploadDeck[];
}

interface UploadUser {
	readonly UserId: number;
	readonly AuthToken: string;
	readonly Preferences?: { [pref: string]: string };
}

enum UploadStatus {
	Processing,
	Success,
	Error,
}

interface UploadCard {
	readonly Name: string;
	readonly Count: number;
	readonly IsPremium: boolean;
}

interface UploadProfile {}
interface UploadRank {}
interface UploadDeck {}

declare let OverwolfPlugin: any;

class StringCipherBridge {
	private plugin: any;
	initialized = false;

	public async encrypt(stringifiedData: string): Promise<string | null> {
		return new Promise<string | null>(async (resolve, reject) => {
			console.debug('[hearthpwn] calling c# plugin to encrypt', stringifiedData);
			const plugin = await this.get();
			console.debug('[hearthpwn] plugin', plugin);
			try {
				plugin.encrypt(stringifiedData, (result) => {
					console.debug('[hearthpwn] encrypted', result);
					resolve(result);
				});
			} catch (e) {
				console.warn('[hearthpwn] could not encrypt', e);
				resolve(null);
			}
		});
	}

	public async decrypt(encryted: string | null): Promise<string | null> {
		return new Promise<string | null>(async (resolve, reject) => {
			console.debug('[hearthpwn] calling c# plugin to decrypt', encryted);
			const plugin = await this.get();
			console.debug('[hearthpwn] plugin', plugin);
			try {
				plugin.decrypt(encryted, (result) => {
					console.debug('[hearthpwn] decrypted from plugin', result);
					resolve(result);
				});
			} catch (e) {
				console.warn('[hearthpwn] could not decrypt', e);
				resolve(null);
			}
		});
	}

	public async get() {
		await this.waitForInit();
		return this.plugin.get();
	}

	public initialize() {
		this.initialized = false;
		try {
			console.log('[hearthpwn] plugin init starting');
			this.plugin = new OverwolfPlugin('hearthpwn-cipher', true);
			this.plugin.initialize(async (status: boolean) => {
				if (status === false) {
					console.error("[hearthpwn] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[hearthpwn] Plugin ' + this.plugin.get()._PluginName_ + ' was loaded!');
				this.plugin.get().onGlobalEvent.addListener((first: string, second: string) => {
					console.log('[hearthpwn] received global event', first, second);
				});
				this.initialized = true;
			});
		} catch (e) {
			console.warn('[hearthpwn]Could not load plugin, retrying', e);
			setTimeout(() => this.initialize(), 2000);
		}
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
