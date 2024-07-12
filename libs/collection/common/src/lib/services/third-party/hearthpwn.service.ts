/* eslint-disable @typescript-eslint/no-empty-interface */
import { Injectable } from '@angular/core';
import { Card } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { COLLECTION_MANAGER_SERVICE_TOKEN, ICollectionManagerService } from '../collection-manager.interface';

const PROFILE_UPLOAD_URL = `https://www.hearthpwn.com/client/upload`;

@Injectable()
export class HearthpwnService extends AbstractFacadeService<HearthpwnService> {
	private collectionManager: ICollectionManagerService;
	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'HearthpwnService', () => !!this.collectionManager);
	}

	protected override assignSubjects() {
		// Do nothing
	}

	protected async init() {
		this.collectionManager = AppInjector.get(COLLECTION_MANAGER_SERVICE_TOKEN);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.hearthpwnSync),
				filter((sync) => sync),
				take(1),
			)
			.subscribe((activeSub) => {
				console.debug('[hearthpwn] activating hearthpwn sync');
				this.collectionManager.collection$$
					.pipe(
						debounceTime(1000),
						distinctUntilChanged((a, b) => deepEqual(a, b)),
					)
					.subscribe(async (collection) => {
						console.debug('[hearthpwn] will sync collection', collection);
						const uploadData: UploadData = await this.transformCollection(collection);
						console.debug('[hearthpwn] uploadData', uploadData);
						const payload = {
							user: this.encrypt(uploadData.User),
							data: this.encrypt(uploadData),
						};
						console.debug('[hearthpwn] upload data', payload);
						const uploadResult = await this.api.callPostApi(PROFILE_UPLOAD_URL, payload);
						console.debug('[hearthpwn] upload result', uploadResult);
					});
			});
	}

	private encrypt(data: any): string {
		const cipher = new StringCipher('fakestring');
		return cipher.Encrypt(JSON.stringify(data));
	}

	private async transformCollection(memoryCollection: readonly Card[]): Promise<UploadData> {
		const prefs = await this.prefs.getPreferences();
		const userId = prefs.hearthpwnUserId;
		const authToken = prefs.hearthpwnAuthToken;
		const profile: UploadUser = {
			AuthToken: authToken,
			UserId: userId,
		};
		const cards = memoryCollection.flatMap((c) => [
			{
				Name: c.id,
				Count: c.count,
				IsPremium: false,
			},
			{
				Name: c.id,
				Count: (c.diamondCount ?? 0) + (c.premiumCount ?? 0) + (c.signatureCount ?? 0),
				IsPremium: true,
			},
		]);
		const result: UploadData = {
			Cards: cards,
			User: profile,
		};
		return result;
	}
}

interface UploadData {
	readonly User: UploadUser;
	readonly Cards: readonly UploadCard[];
	readonly Status?: UploadStatus;
	readonly Profile?: UploadProfile;
	readonly Rank?: UploadRank;
	readonly Decks?: readonly UploadDeck[];
}

interface UploadUser {
	readonly UserId: number;
	readonly AuthToken: string;
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

class StringCipher {
	private static readonly SIZEOF_PADDING = 4;
	private static readonly SIZEOF_STATE = 256;

	private mState: Uint8Array = new Uint8Array(StringCipher.SIZEOF_STATE);

	constructor(pKey: Uint8Array | string) {
		if (typeof pKey === 'string') {
			this.InitializeState(this.HexStringToByteArray(pKey));
		} else {
			this.InitializeState(pKey);
		}
	}

	private InitializeState(pKey: Uint8Array): void {
		let b = 0;
		do {
			this.mState[b] = b;
		} while (++b !== 0);

		b = 0;
		let b2 = 0;
		let b3 = 0;
		do {
			b2 += this.mState[b];
			b2 += pKey[b % pKey.length];
			b3 = this.mState[b];
			this.mState[b] = this.mState[b2];
			this.mState[b2] = b3;
			b += 2;
		} while (b !== 0);
	}

	public Encrypt(pString: string): string {
		const array = new Uint8Array(StringCipher.SIZEOF_STATE);
		const array2 = new Uint8Array(StringCipher.SIZEOF_PADDING);
		const bytes = new TextEncoder().encode(pString);
		const array3 = new Uint8Array(StringCipher.SIZEOF_PADDING + bytes.length);

		array.set(this.mState);
		crypto.getRandomValues(array2);
		array3.set(array2);
		array3.set(bytes, StringCipher.SIZEOF_PADDING);

		StringCipher.Encrypt(array, array3);
		return btoa(String.fromCharCode(...array3));
	}

	public Decrypt(pString: string): string {
		const array = new Uint8Array(this.mState.length);
		const array2 = Uint8Array.from(atob(pString), (c) => c.charCodeAt(0));

		array.set(this.mState);
		StringCipher.Decrypt(array, array2);
		return new TextDecoder().decode(array2.slice(StringCipher.SIZEOF_PADDING));
	}

	// eslint-disable-next-line @typescript-eslint/member-ordering
	private static Encrypt(pState: Uint8Array, pData: Uint8Array): void {
		let b = 255;
		let num = 0;
		let num2 = 0;
		for (let i = 0; i < pData.length; i++) {
			num = (num + 1) % 256;
			num2 = (num2 + pState[num]) % 256;
			const b2 = pState[num];
			pState[num] = pState[num2];
			pState[num2] = b2;
			pData[i] ^= pState[(pState[num] + pState[num2]) % 256];
			pData[i] ^= b;
			b = pData[i];
		}
	}

	// eslint-disable-next-line @typescript-eslint/member-ordering
	private static Decrypt(pState: Uint8Array, pData: Uint8Array): void {
		let b = 255;
		let num = 0;
		let num2 = 0;
		for (let i = 0; i < pData.length; i++) {
			num = (num + 1) % 256;
			num2 = (num2 + pState[num]) % 256;
			const b2 = pState[num];
			pState[num] = pState[num2];
			pState[num2] = b2;
			const temp = pData[i];
			pData[i] ^= pState[(pState[num] + pState[num2]) % 256];
			pData[i] ^= b;
			b = temp;
		}
	}

	private HexStringToByteArray(hex: string): Uint8Array {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
		}
		return bytes;
	}
}
