import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { isVersionBefore, sleep, sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { toModVersion, toVersionString } from '../model/mods-config';
import { ModsConfigService } from './mods-config.service';
import { ModsUtilsService } from './mods-utils.service';

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
		private readonly modsUtils: ModsUtilsService,
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

		// Typical use-case is that the game updates, starts, auto-quits (because of unstripped libs).
		// Ideally this can then trigger, refresh the libs, so that on next launch it works
		// TODO: test this!
		this.inGame$$.pipe(distinctUntilChanged()).subscribe((inGame) => {
			if (!inGame) {
				this.modsUtils.refreshEngine();
			}
		});

		combineLatest([this.internalModsData$$.asObservable(), this.store.listenModsConfig$((conf) => conf)])
			.pipe(
				tap((info) => console.debug('[mods-manager] processing mods data', info)),
				// filter(([modsData, conf]) => !!modsData?.length),
			)
			.subscribe(async ([modsData, [conf]]) => {
				let modsDirty = false;
				const newConf = { ...conf };
				for (const modData of modsData) {
					if (newConf[modData.AssemblyName] == null) {
						newConf[modData.AssemblyName] = {
							assemblyName: modData.AssemblyName,
							enabled: modData.Registered,
						};
						modsDirty = true;
					}

					newConf[modData.AssemblyName] = {
						...newConf[modData.AssemblyName],
						modName: modData.Name ?? newConf[modData.AssemblyName].modName,
						downloadLink: modData.DownloadLink ?? newConf[modData.AssemblyName].downloadLink,
						lastKnownVersion:
							toModVersion(modData.Version) ?? newConf[modData.AssemblyName]?.lastKnownVersion,
					};

					if (conf[modData.AssemblyName]?.modName !== newConf[modData.AssemblyName].modName) {
						modsDirty = true;
					}
					if (conf[modData.AssemblyName]?.downloadLink !== newConf[modData.AssemblyName].downloadLink) {
						modsDirty = true;
					}
					if (
						toVersionString(conf[modData.AssemblyName]?.lastKnownVersion) !==
						toVersionString(newConf[modData.AssemblyName]?.lastKnownVersion)
					) {
						modsDirty = true;
					}
					if (
						toVersionString(conf[modData.AssemblyName]?.updateAvailableVersion) !==
						toVersionString(newConf[modData.AssemblyName]?.updateAvailableVersion)
					) {
						modsDirty = true;
					}
				}
				// If we update a mod outside of a game, we don't have live data, so we have to rely fuily on the conf
				const dataFromLiveOrPrefs: readonly Partial<ModData>[] = !!modsData?.length
					? modsData
					: Object.keys(newConf).map((assemblyName) => ({
							AssemblyName: assemblyName,
							Name: newConf[assemblyName]?.modName ?? assemblyName,
					  }));
				const result: ModData[] = [...dataFromLiveOrPrefs]
					.map(
						(modData) =>
							({
								...modData,
								Registered: newConf[modData.AssemblyName].enabled,
								Version: toVersionString(newConf[modData.AssemblyName]?.lastKnownVersion),
								DownloadLink: newConf[modData.AssemblyName].downloadLink,
								updateAvailableVersion: toVersionString(
									newConf[modData.AssemblyName]?.updateAvailableVersion,
								),
							} as ModData),
					)
					.sort(sortByProperties((m: ModData) => [m.Name]));

				// To avoid infinite loops
				if (modsDirty) {
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
		this.sendToWs(JSON.stringify(message));
	}

	public async deactivateMods(modNames: readonly string[]) {
		const message = {
			type: 'toggle-mod',
			modNames: modNames,
			status: 'off',
		};
		console.debug('[mods-manager] deactivating mods', message);
		this.sendToWs(JSON.stringify(message));
	}

	private async sendToWs(msg: string) {
		await this.wsReady();
		try {
			this.ws?.send(msg);
		} catch (e) {
			console.warn('[mods-boostrap] could not send message to websocket', e);
		}
	}

	private wsReady(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.ws?.readyState === this.ws?.OPEN) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 150);
				}
			};
			dbWait();
		});
	}

	public async hasUpdates(mod: ModData): Promise<string> {
		const userRepo = mod.DownloadLink.split('https://github.com/')[1];
		const apiCheckUrl = `https://api.github.com/repos/${userRepo}/releases/latest`;
		console.debug('[mods-manager] checking updates for mod', mod, userRepo, apiCheckUrl);
		const releaseDataStr = await this.api.get(apiCheckUrl);
		console.debug('[mods-manager] releaseDataStr', releaseDataStr);
		if (!releaseDataStr?.length) {
			return null;
		}

		try {
			const releaseData = JSON.parse(releaseDataStr);
			console.debug('[mods-manager] releaseData', releaseData);
			const tagName: string = releaseData.tag_name;
			console.debug('[mods-manager] tagName', tagName);
			const hasUpdate = isVersionBefore(mod.Version, tagName);
			console.debug('[mods-manager] hasUpdate', hasUpdate);
			return hasUpdate ? tagName : null;
		} catch (e) {
			console.warn('[mods-manager] could not parse release data', releaseDataStr);
			return null;
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
					if (messageData?.type === 'mods-info') {
						this.internalModsData$$.next(
							messageData.data
								?.filter((d) => d.AssemblyName !== 'FirestoneMelonModsManager')
								?.filter((d) => d.AssemblyName !== 'GameEventsConnector') ?? [],
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
		// So that it doesn't conflict with the data from the config
		this.internalModsData$$.next([]);
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
	readonly updateAvailableVersion: string;
}
