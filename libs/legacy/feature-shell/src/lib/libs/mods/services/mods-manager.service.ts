import { Injectable } from '@angular/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { sleep, sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Injectable()
export class ModsManagerService {
	public modsData$$ = new BehaviorSubject<readonly ModData[]>([]);

	private inGame$$ = new BehaviorSubject<boolean>(false);
	private internalModsData$$ = new BehaviorSubject<readonly ModData[]>([]);

	private ws: WebSocket;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
	) {
		window['modsManager'] = this;
	}

	public async init() {
		console.log('[mods-manager] Initializing mods services');
		await this.store.initComplete();
		console.log('[mods-manager] moving on');

		this.gameStatus.onGameExit(() => this.inGame$$.next(false));
		this.gameStatus.onGameStart(() => this.inGame$$.next(true));
		this.inGame$$.pipe(distinctUntilChanged()).subscribe((inGame) => {
			if (inGame) {
				this.connectWebSocket();
			} else {
				this.disconnectWebSocket();
			}
		});

		combineLatest([this.internalModsData$$.asObservable(), this.store.listenPrefs$((prefs) => prefs.mods)])
			.pipe(filter(([modsData, modsPrefs]) => !!modsData?.length))
			.subscribe(async ([modsData, [modsPrefs]]) => {
				const modsToToggle = [];
				for (const modData of modsData) {
					if (modsPrefs[modData.AssemblyName] == null) {
						modsPrefs[modData.AssemblyName] = modData.Registered;
						modsToToggle.push(modData.AssemblyName);
					}
				}
				const result = [...modsData]
					.map(
						(modData) =>
							({
								...modData,
								Registered: modsPrefs[modData.AssemblyName],
							} as ModData),
					)
					.sort(sortByProperties((m: ModData) => [m.Name]));

				if (modsToToggle.length > 0) {
					const prefs = await this.prefs.getPreferences();
					const newPrefs: Preferences = { ...prefs, mods: modsPrefs };
					await this.prefs.savePreferences(newPrefs);
				}

				// Because mods are loaded as Registered by default
				const modsToDeactivate = modsData
					.filter((m) => m.Registered)
					.filter((m) => {
						const processedMod = result.find((m2) => m2.AssemblyName === m.AssemblyName);
						return !processedMod.Registered;
					});
				if (!!modsToDeactivate.length) {
					this.deactivateMods(modsToDeactivate.map((m) => m.AssemblyName));
				}

				this.modsData$$.next(result);
			});
	}

	public async toggleMods(modNames: readonly string[]) {
		const message = {
			type: 'toggle-mod',
			modNames: modNames,
		};
		console.debug('[mods-manager] toggling mods', message);
		this.ws?.send(JSON.stringify(message));
	}

	public async deactivateMods(modNames: readonly string[]) {
		const message = {
			type: 'toggle-mod',
			modNames: modNames,
			status: 'off',
		};
		console.debug('[mods-manager] deactivating mods', message);
		this.ws?.send(JSON.stringify(message));
	}

	private async connectWebSocket() {
		console.log('[mods-manager] connecting');
		if (!!this.ws && this.ws.readyState === this.ws?.OPEN) {
			// console.debug('[mods-manager] websocket already open');
			return;
		}
		let retriesLeft = 30;
		while (retriesLeft >= 0) {
			try {
				this.ws = new WebSocket('ws://127.0.0.1:9978/firestone-mods-manager');
				this.ws.addEventListener('message', (msgEvent) => {
					const messageData: ModMessage<readonly ModData[]> = JSON.parse(msgEvent.data);
					console.debug('[mods-manager] received message', messageData);
					if (messageData.type === 'mods-info') {
						this.internalModsData$$.next(
							messageData.data
								.filter((d) => d.AssemblyName !== 'FirestoneMelonModsManager')
								.filter((d) => d.AssemblyName !== 'GameEventsConnector'),
						);
					}
				});
				console.log('[mods-manager] WS client created');
				return;
			} catch (e) {
				console.debug('[mods-manager] could not connect to websocket, retrying', e);
				retriesLeft--;
			}
			await sleep(2000);
		}
	}

	private async disconnectWebSocket() {
		console.log('[mods-manager] discconnecting');
		this.ws?.close();
		this.ws = null;
	}
}

interface ModMessage<T> {
	readonly type: 'mods-info';
	readonly data: T;
}

export interface ModData {
	readonly Name: string;
	readonly Registered: boolean;
	readonly Version: string;
	readonly DownloadLink: string;
	readonly AssemblyName: string;
}
