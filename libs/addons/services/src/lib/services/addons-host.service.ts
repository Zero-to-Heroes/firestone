import { Injectable } from '@angular/core';
import {
	ADDON_PERMISSIONS,
	BattlegroundsGameEndPayload,
	hasAddonPermission,
	InstalledAddon,
} from '@firestone/addons/common';
import type { LogFileBackend } from '@firestone/shared/common/service';
import { LOG_FILE_BACKEND } from '@firestone/shared/common/service';
import { AppInjector, isMainProcess, waitForReady } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { buildAddonBootstrapSource } from '../runtime/addon-bootstrap';
import { AddonsApiGateway } from './addons-api-gateway';
import { AddonsInstallService } from './addons-install.service';

interface IframeRuntime {
	readonly kind: 'iframe';
	readonly addonId: string;
	readonly iframe: HTMLIFrameElement;
	readonly blobUrl: string;
	ready: boolean;
}

interface VmRuntime {
	readonly kind: 'vm';
	readonly addonId: string;
	readonly eventHandlers: Map<string, Array<(payload: unknown) => void>>;
	ready: boolean;
}

type LoadedAddonRuntime = IframeRuntime | VmRuntime;

/**
 * Loads enabled add-ons in an isolated runtime:
 * - Browser / Overwolf: sandboxed iframe + postMessage
 * - Electron main process (no DOM): Node vm context with a direct capability API
 */
@Injectable()
export class AddonsHostService {
	private install: AddonsInstallService;
	private gateway: AddonsApiGateway;
	private fileBackend: LogFileBackend;

	private readonly loaded = new Map<string, LoadedAddonRuntime>();
	private messageListener: ((event: MessageEvent) => void) | null = null;
	private addonsSub: Subscription | null = null;
	private hostContainer: HTMLDivElement | null = null;
	private started = false;

	public async init(): Promise<void> {
		if (this.started) {
			return;
		}
		this.started = true;
		this.install = AppInjector.get(AddonsInstallService);
		this.gateway = AppInjector.get(AddonsApiGateway);
		this.fileBackend = AppInjector.get(LOG_FILE_BACKEND);

		await waitForReady(this.install);

		this.gateway.configure({
			hostStateProvider: () => this.install.getHostState(),
			addonsByIdProvider: () => {
				const map = new Map<string, InstalledAddon>();
				for (const addon of this.install.addons$$.value) {
					map.set(addon.manifest.id, addon);
				}
				return map;
			},
		});

		if (this.canUseIframeRuntime()) {
			this.ensureHostContainer();
			this.messageListener = (event) => this.onMessage(event);
			window.addEventListener('message', this.messageListener);
		}

		this.addonsSub = this.install.addons$$.subscribe((addons) => {
			void this.syncRuntimes(addons);
		});
		await this.syncRuntimes(this.install.addons$$.value);
		console.log('[addons-host] initialized', this.canUseIframeRuntime() ? 'iframe' : 'vm');
	}

	public async emitBattlegroundsGameEnd(payload: BattlegroundsGameEndPayload): Promise<void> {
		for (const addon of this.install.addons$$.value) {
			if (!addon.enabled || addon.loadError) {
				continue;
			}
			if (!hasAddonPermission(addon.manifest, ADDON_PERMISSIONS.BATTLEGROUNDS_GAME_END)) {
				continue;
			}
			const runtime = this.loaded.get(addon.manifest.id);
			if (!runtime) {
				continue;
			}
			if (runtime.kind === 'iframe') {
				runtime.iframe.contentWindow?.postMessage(
					{
						channel: 'firestone-addon',
						type: 'event',
						addonId: addon.manifest.id,
						eventName: 'battlegroundsGameEnd',
						payload,
					},
					'*',
				);
			} else {
				const handlers = runtime.eventHandlers.get('battlegroundsGameEnd') ?? [];
				for (const handler of handlers) {
					try {
						await Promise.resolve(handler(payload));
					} catch (e) {
						console.error('[addons-host] vm event handler error', addon.manifest.id, e);
					}
				}
			}
		}
	}

	public destroy(): void {
		if (this.messageListener) {
			window.removeEventListener('message', this.messageListener);
			this.messageListener = null;
		}
		this.addonsSub?.unsubscribe();
		this.addonsSub = null;
		for (const addonId of [...this.loaded.keys()]) {
			this.unloadAddon(addonId);
		}
		this.hostContainer?.remove();
		this.hostContainer = null;
		this.started = false;
	}

	private canUseIframeRuntime(): boolean {
		return typeof document !== 'undefined' && typeof window !== 'undefined' && !isMainProcess();
	}

	private ensureHostContainer(): void {
		if (this.hostContainer || typeof document === 'undefined') {
			return;
		}
		const el = document.createElement('div');
		el.id = 'firestone-addons-host';
		el.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
		document.body.appendChild(el);
		this.hostContainer = el;
	}

	private async syncRuntimes(addons: readonly InstalledAddon[]): Promise<void> {
		const desired = new Set(addons.filter((a) => a.enabled && !a.loadError).map((a) => a.manifest.id));
		for (const loadedId of [...this.loaded.keys()]) {
			if (!desired.has(loadedId)) {
				this.unloadAddon(loadedId);
			}
		}
		for (const addon of addons) {
			if (!desired.has(addon.manifest.id) || this.loaded.has(addon.manifest.id)) {
				continue;
			}
			try {
				await this.loadAddon(addon);
			} catch (e) {
				console.error('[addons-host] failed to load', addon.manifest.id, e);
			}
		}
	}

	private async loadAddon(addon: InstalledAddon): Promise<void> {
		const mainSource = await this.fileBackend.readTextFile(addon.mainPath);
		if (!mainSource?.length) {
			throw new Error(`Empty main file for ${addon.manifest.id}`);
		}
		if (this.canUseIframeRuntime()) {
			await this.loadAddonInIframe(addon, mainSource);
		} else {
			await this.loadAddonInVm(addon, mainSource);
		}
	}

	private async loadAddonInIframe(addon: InstalledAddon, mainSource: string): Promise<void> {
		this.ensureHostContainer();
		if (!this.hostContainer) {
			throw new Error('No DOM available to host add-on iframes');
		}
		const bootstrap = buildAddonBootstrapSource(addon.manifest.id);
		const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><script>${bootstrap}</script><script>${mainSource}</script></body></html>`;
		const blob = new Blob([html], { type: 'text/html' });
		const blobUrl = URL.createObjectURL(blob);

		const iframe = document.createElement('iframe');
		iframe.setAttribute('sandbox', 'allow-scripts');
		iframe.setAttribute('title', `firestone-addon-${addon.manifest.id}`);
		iframe.style.cssText = 'width:0;height:0;border:0;';
		iframe.src = blobUrl;

		const runtime: IframeRuntime = {
			kind: 'iframe',
			addonId: addon.manifest.id,
			iframe,
			blobUrl,
			ready: false,
		};
		this.loaded.set(addon.manifest.id, runtime);
		this.hostContainer.appendChild(iframe);
		console.log('[addons-host] loaded iframe', addon.manifest.id);
	}

	private async loadAddonInVm(addon: InstalledAddon, mainSource: string): Promise<void> {
		// Electron main process: isolated VM context, same capability API as the iframe bridge.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const vm = eval('require')('vm') as typeof import('vm');
		const eventHandlers = new Map<string, Array<(payload: unknown) => void>>();
		const addonId = addon.manifest.id;
		const gateway = this.gateway;

		const api = {
			events: {
				onBattlegroundsGameEnd: (handler: (payload: unknown) => void) => {
					const list = eventHandlers.get('battlegroundsGameEnd') ?? [];
					list.push(handler);
					eventHandlers.set('battlegroundsGameEnd', list);
					return () => {
						eventHandlers.set(
							'battlegroundsGameEnd',
							(eventHandlers.get('battlegroundsGameEnd') ?? []).filter((h) => h !== handler),
						);
					};
				},
			},
			storage: {
				get: (key: string) => gateway.handleRpc(addonId, 'storage.get', [key]),
				set: (key: string, value: unknown) => gateway.handleRpc(addonId, 'storage.set', [key, value]),
			},
			net: {
				fetch: (url: string, init?: unknown) => gateway.handleRpc(addonId, 'net.fetch', [url, init ?? {}]),
			},
			log: {
				info: (...args: unknown[]) => gateway.handleRpc(addonId, 'log.info', args),
				warn: (...args: unknown[]) => gateway.handleRpc(addonId, 'log.warn', args),
				error: (...args: unknown[]) => gateway.handleRpc(addonId, 'log.error', args),
			},
			getSettings: () => gateway.handleRpc(addonId, 'getSettings', []),
		};

		const context = vm.createContext({
			console,
			setTimeout,
			clearTimeout,
			firestone: {
				defineAddon: (factory: (api: unknown) => unknown) => {
					Promise.resolve(factory(api))
						.then(() => {
							const runtime = this.loaded.get(addonId);
							if (runtime?.kind === 'vm') {
								runtime.ready = true;
							}
							console.log('[addons-host] vm add-on ready', addonId);
						})
						.catch((err) => console.error('[addons-host] vm add-on error', addonId, err));
				},
			},
		});

		this.loaded.set(addonId, {
			kind: 'vm',
			addonId,
			eventHandlers,
			ready: false,
		});
		vm.runInContext(mainSource, context, { filename: `addon:${addonId}` });
		console.log('[addons-host] loaded vm', addonId);
	}

	private unloadAddon(addonId: string): void {
		const runtime = this.loaded.get(addonId);
		if (!runtime) {
			return;
		}
		if (runtime.kind === 'iframe') {
			runtime.iframe.remove();
			URL.revokeObjectURL(runtime.blobUrl);
		}
		this.loaded.delete(addonId);
		console.log('[addons-host] unloaded', addonId);
	}

	private async onMessage(event: MessageEvent): Promise<void> {
		const data = event.data;
		if (!data || data.channel !== 'firestone-addon' || typeof data.addonId !== 'string') {
			return;
		}
		const runtime = this.loaded.get(data.addonId);
		if (!runtime || runtime.kind !== 'iframe' || event.source !== runtime.iframe.contentWindow) {
			return;
		}

		if (data.type === 'addon-ready') {
			runtime.ready = true;
			console.log('[addons-host] add-on ready', data.addonId);
			return;
		}
		if (data.type === 'addon-error') {
			console.error('[addons-host] add-on error', data.addonId, data.error);
			return;
		}
		if (data.type === 'rpc') {
			let result: unknown = null;
			let error: string | null = null;
			try {
				result = await this.gateway.handleRpc(data.addonId, data.method, data.args ?? []);
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
				console.warn('[addons-host] rpc failed', data.addonId, data.method, error);
			}
			runtime.iframe.contentWindow?.postMessage(
				{
					channel: 'firestone-addon',
					type: 'rpc-result',
					addonId: data.addonId,
					id: data.id,
					result,
					error,
				},
				'*',
			);
		}
	}
}
