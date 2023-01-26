import { Injectable } from '@angular/core';
import { ApiRunner } from '@legacy-import/src/lib/js/services/api-runner';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { isVersionBefore, sleep, sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { toModVersion, toVersionString } from '../model/mods-config';
import { ModsConfigService } from './mods-config.service';

@Injectable()
export class ModsManagerService {
	public modsData$$ = new BehaviorSubject<readonly ModData[]>([]);

	private inGame$$ = new BehaviorSubject<boolean>(false);
	private internalModsData$$ = new BehaviorSubject<readonly ModData[]>([]);

	private ws: WebSocket;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly modsConfigService: ModsConfigService,
		private readonly api: ApiRunner,
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

		combineLatest([this.internalModsData$$.asObservable(), this.store.listenModsConfig$((conf) => conf)])
			.pipe(
				tap((info) => console.debug('[mods-manager] processing mods data', info)),
				filter(([modsData, conf]) => !!modsData?.length),
			)
			.subscribe(async ([modsData, [conf]]) => {
				const modsToToggle = [];
				const newConf = { ...conf };
				for (const modData of modsData) {
					if (newConf[modData.AssemblyName] == null) {
						newConf[modData.AssemblyName] = {
							assemblyName: modData.AssemblyName,
							enabled: modData.Registered,
						};
						modsToToggle.push(modData.AssemblyName);
					}

					// Should only be necessary the first time a mod is loaded inside the game
					if (!newConf[modData.AssemblyName].modName) {
						newConf[modData.AssemblyName] = {
							...newConf[modData.AssemblyName],
							modName: modData.Name,
							downloadLink: modData.DownloadLink,
							lastKnownVersion: toModVersion(modData.Version),
						};
						modsToToggle.push(modData.AssemblyName);
					}
				}
				const result = [...modsData]
					.map(
						(modData) =>
							({
								...modData,
								Registered: newConf[modData.AssemblyName].enabled,
								Version: toVersionString(newConf[modData.AssemblyName].lastKnownVersion),
								DownloadLink: newConf[modData.AssemblyName].downloadLink,
								updateAvailable: newConf[modData.AssemblyName].updateAvailable,
							} as ModData),
					)
					.sort(sortByProperties((m: ModData) => [m.Name]));

				// To avoid infinite loops
				if (modsToToggle.length > 0) {
					this.modsConfigService.updateConf(newConf);
				}

				// Because mods are loaded as Registered by default
				const modsToDeactivate = modsData
					.filter((m) => m.Registered)
					.filter((m) => {
						const processedMod = result.find((m2) => m2.AssemblyName === m.AssemblyName);
						return !processedMod.Registered;
					});
				if (!!modsToDeactivate.length) {
					console.debug('[mods-manager] will request mod deactivationg', modsData, result);
					this.deactivateMods(modsToDeactivate.map((m) => m.AssemblyName));
				}

				console.debug('[mods-manager] sending mods data', result);
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

	public async hasUpdates(mod: ModData): Promise<boolean> {
		const userRepo = mod.DownloadLink.split('https://github.com/')[1];
		const apiCheckUrl = `https://api.github.com/repos/${userRepo}/releases/latest`;
		console.debug('[mods-manager] checking updates for mod', mod, userRepo, apiCheckUrl);
		const releaseDataStr = await this.api.get(apiCheckUrl);
		console.debug('[mods-manager] releaseDataStr', releaseDataStr);
		if (!releaseDataStr?.length) {
			return false;
		}

		try {
			const releaseData = JSON.parse(releaseDataStr);
			console.debug('[mods-manager] releaseData', releaseData);
			const tagName = releaseData.tag_name;
			console.debug('[mods-manager] tagName', tagName);
			const hasUpdate = isVersionBefore(mod.Version, tagName);
			console.debug('[mods-manager] hasUpdate', hasUpdate);
			return hasUpdate;
		} catch (e) {
			console.warn('[mods-manager] could not parse release data', releaseDataStr);
			return false;
		}
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
	readonly updateAvailable: boolean;
}
