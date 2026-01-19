/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { Card, SceneService } from '@firestone/memory';
import { HEARTHPWN_SYNC, PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import {
	catchError,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	firstValueFrom,
	map,
	pairwise,
	switchMap,
	throwError,
	timeout,
} from 'rxjs';
import { COLLECTION_MANAGER_SERVICE_TOKEN, ICollectionManagerService } from '../collection-manager.interface';

const PROFILE_UPLOAD_URL = `https://www.hearthpwn.com/client/upload`;

@Injectable()
export class HearthpwnService extends AbstractFacadeService<HearthpwnService> {
	private collectionManager: ICollectionManagerService;
	private http: HttpClient;
	private prefs: PreferencesService;
	private scene: SceneService;

	private cipherBridge: StringCipherBridge;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'HearthpwnService', () => true);
	}

	protected override assignSubjects() {
		// Do nothing
	}

	protected async init() {
		if (!HEARTHPWN_SYNC) {
			return;
		}
		console.debug('[hearthpwn] init');
		this.collectionManager = AppInjector.get(COLLECTION_MANAGER_SERVICE_TOKEN);
		this.http = AppInjector.get(HttpClient);
		this.prefs = AppInjector.get(PreferencesService);
		this.scene = AppInjector.get(SceneService);
		this.cipherBridge = new StringCipherBridge();
		this.cipherBridge.initialize();
		console.debug('[hearthpwn] init done');

		// Sync immediately when the pref is activated for the first time
		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.hearthpwnSync),
				pairwise(),
			)
			.subscribe(async ([previous, current]) => {
				if (!previous && current) {
					console.debug('[hearthpwn] pref activated for the first time, forcing sync');
					const collection = await this.collectionManager.collection$$.getValueWithInit();
					if (collection?.length > 0) {
						this.syncCollection(collection);
					}
				}
			});

		// Sync on collection changes only when on COLLECTIONMANAGER scene
		combineLatest([
			this.prefs.preferences$$.pipe(map((prefs) => prefs.hearthpwnSync)),
			this.scene.currentScene$$,
		])
			.pipe(
				filter(([shouldSync, scene]) => shouldSync && scene === SceneMode.COLLECTIONMANAGER),
				switchMap(() =>
					this.collectionManager.collection$$.pipe(
						debounceTime(10000),
					),
				),
				distinctUntilChanged(
					(a, b) => {
						console.debug('[hearthpwn] comparing collections',
							a?.length, b?.length,
							a?.map((c) => cardCount(c)).reduce((a, b) => a + b, 0), b?.map((c) => cardCount(c)).reduce((a, b) => a + b, 0));
						return a?.length === b?.length &&
							a.map((c) => cardCount(c)).reduce((a, b) => a + b, 0) ===
							b.map((c) => cardCount(c)).reduce((a, b) => a + b, 0)
					},
				),
			)
			.subscribe((collection) => this.syncCollection(collection));
	}

	private async syncCollection(collection: readonly Card[]): Promise<void> {
		// Check if collection size has changed since last sync
		const currentSize = collection.map((c) => cardCount(c)).reduce((a, b) => a + b, 0);
		const prefs = await this.prefs.getPreferences();
		const lastSyncedSize = prefs.hearthpwnLastSyncedCollectionSize ?? 0;

		if (currentSize === lastSyncedSize) {
			console.debug('[hearthpwn] collection size unchanged, skipping sync', currentSize);
			return;
		}

		console.debug('[hearthpwn] will sync collection', collection, 'size changed from', lastSyncedSize, 'to', currentSize);
		const uploadData: UploadData = await this.transformCollection(collection);
		console.debug('[hearthpwn] uploadData', uploadData, JSON.stringify(uploadData.User));
		const encryptedUser = await this.encrypt(JSON.stringify(uploadData.User));
		const encryptedData = await this.encrypt(JSON.stringify(uploadData.Game));
		console.debug('[hearthpwn] encrypted', encryptedUser);
		const payload = {
			user: encryptedUser!,
			data: encryptedData!,
		};
		console.debug('[hearthpwn] upload data', payload);
		const encoded = encodeDictionaryAsForm(payload);
		console.debug('[hearthpwn] encoded data', encoded);

		try {
			const uploadResult = await firstValueFrom(
				this.http
					.post(PROFILE_UPLOAD_URL, encoded, {
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded; charset=us-ascii',
							origin: 'https://www.hearthpwn.com',
						},
						responseType: 'text',
					})
					.pipe(
						timeout(120000),
						catchError((error) => {
							if (error.name === 'TimeoutError') {
								console.error('[hearthpwn] Upload timeout after 120 seconds');
							} else {
								console.error('[hearthpwn] Upload error', error);
							}
							return throwError(() => error);
						}),
					),
			);
			console.debug('[hearthpwn] upload result', uploadResult);
			// Update the stored collection size after successful sync
			await this.prefs.updatePrefs('hearthpwnLastSyncedCollectionSize', currentSize);
			console.debug('[hearthpwn] updated last synced collection size to', currentSize);
		} catch (error) {
			console.error('[hearthpwn] Failed to upload collection', error);
		}
	}

	private async encrypt(data: string): Promise<string | null> {
		return this.cipherBridge.encrypt(data);
	}

	private async decrypt(data: string | null): Promise<string | null> {
		return this.cipherBridge.decrypt(data);
	}

	private async transformCollection(memoryCollection: readonly Card[]): Promise<UploadData> {
		const prefs = await this.prefs.getPreferences();
		const userId = prefs.hearthpwnUserId;
		const authToken = prefs.hearthpwnAuthToken;
		const profile: UploadUser = {
			AuthToken: authToken!,
			UserId: userId!,
			Preferences: {},
		};
		const cards = memoryCollection
			.flatMap((c) => [
				{
					Name: c.id,
					Count: c.count ?? 0,
					IsPremium: false,
				},
				{
					Name: c.id,
					Count: (c.premiumCount ?? 0) + (c.diamondCount ?? 0) + (c.signatureCount ?? 0),
					IsPremium: true,
				},
			])
			.slice(0, 20000);
		const result: UploadData = {
			User: profile,
			Game: {
				Cards: cards,
				Status: UploadStatus.Processing,
				Profile: {},
				Rank: {},
				Decks: [],
			},
		};
		return result;
	}
}

function encodeDictionaryAsForm(dict: Record<string, string>): string {
	const sb: string[] = [];
	for (const key in dict) {
		if (!Object.prototype.hasOwnProperty.call(dict, key)) continue;
		const value = dict[key] ?? '';
		let encodedValue = '';
		for (let i = 0; i < value.length; i += 30000) {
			encodedValue += encodeURIComponent(value.substring(i, i + 30000));
		}
		sb.push(`${encodeURIComponent(key)}=${encodedValue}`);
	}
	return sb.join('&');
}

interface UploadData {
	readonly User: UploadUser;
	readonly Game: GameData;
}

interface GameData {
	readonly Cards: readonly UploadCard[];
	readonly Status: UploadStatus;
	readonly Profile: UploadProfile;
	readonly Rank: UploadRank;
	readonly Decks: readonly UploadDeck[];
}

interface UploadUser {
	readonly AuthToken: string;
	readonly UserId: number;
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

interface UploadProfile { }
interface UploadRank { }
interface UploadDeck { }

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

const cardCount = (card: Card) =>
	(card.count ?? 0) + (card.premiumCount ?? 0) + (card.diamondCount ?? 0) + (card.signatureCount ?? 0);
