import { Injectable } from '@angular/core';
import {
	ADDON_PERMISSIONS,
	AddonFetchRequest,
	AddonFetchResponse,
	AddonHostState,
	AddonManifest,
	hasAddonPermission,
	InstalledAddon,
	isFetchHostAllowed,
} from '@firestone/addons/common';
import type { LogFileBackend } from '@firestone/shared/common/service';
import { DiskCacheService, LOG_FILE_BACKEND } from '@firestone/shared/common/service';
import { AppInjector } from '@firestone/shared/framework/core';

const ADDON_KV_PREFIX = 'addon-kv.';

/**
 * Enforces capability permissions for sandboxed add-on RPC calls.
 * Does not expose Preferences, membership, premium, or other host services.
 */
@Injectable()
export class AddonsApiGateway {
	private fileBackend: LogFileBackend;
	private diskCache: DiskCacheService;
	private hostStateProvider: (() => AddonHostState) | null = null;
	private addonsByIdProvider: (() => ReadonlyMap<string, InstalledAddon>) | null = null;

	private async ensureDeps(): Promise<void> {
		if (!this.fileBackend) {
			this.fileBackend = AppInjector.get(LOG_FILE_BACKEND);
		}
		if (!this.diskCache) {
			this.diskCache = AppInjector.get(DiskCacheService);
		}
	}

	public configure(options: {
		hostStateProvider: () => AddonHostState;
		addonsByIdProvider: () => ReadonlyMap<string, InstalledAddon>;
	}): void {
		this.hostStateProvider = options.hostStateProvider;
		this.addonsByIdProvider = options.addonsByIdProvider;
	}

	public async handleRpc(addonId: string, method: string, args: readonly unknown[]): Promise<unknown> {
		await this.ensureDeps();
		const addon = this.addonsByIdProvider?.().get(addonId);
		if (!addon) {
			throw new Error(`Unknown add-on: ${addonId}`);
		}
		const manifest = addon.manifest;

		switch (method) {
			case 'getSettings':
				return this.getSettings(manifest);
			case 'storage.get':
				this.requirePermission(manifest, ADDON_PERMISSIONS.STORAGE);
				return this.storageGet(addonId, String(args[0] ?? ''));
			case 'storage.set':
				this.requirePermission(manifest, ADDON_PERMISSIONS.STORAGE);
				await this.storageSet(addonId, String(args[0] ?? ''), args[1]);
				return true;
			case 'net.fetch':
				this.requirePermission(manifest, ADDON_PERMISSIONS.NET_FETCH);
				return this.netFetch(manifest, args[0] as string, (args[1] as AddonFetchRequest | undefined) ?? {});
			case 'log.info':
				console.log(`[addon:${addonId}]`, ...args);
				return true;
			case 'log.warn':
				console.warn(`[addon:${addonId}]`, ...args);
				return true;
			case 'log.error':
				console.error(`[addon:${addonId}]`, ...args);
				return true;
			default:
				throw new Error(`Unknown RPC method: ${method}`);
		}
	}

	private requirePermission(manifest: AddonManifest, permission: string): void {
		if (!hasAddonPermission(manifest, permission as any)) {
			throw new Error(`Permission denied: ${permission}`);
		}
	}

	private getSettings(manifest: AddonManifest): { [key: string]: boolean | string | number } {
		const state = this.hostStateProvider?.() ?? { enabledById: {}, settingsById: {} };
		const stored = state.settingsById[manifest.id] ?? {};
		const result: { [key: string]: boolean | string | number } = {};
		for (const setting of manifest.settings ?? []) {
			const value = stored[setting.key];
			result[setting.key] = value !== undefined ? value : ((setting.default as any) ?? null);
		}
		return result;
	}

	private async storageGet(addonId: string, key: string): Promise<unknown> {
		if (!key) {
			return null;
		}
		const fileKey = `${ADDON_KV_PREFIX}${addonId}.${sanitizeKey(key)}.json`;
		return this.diskCache.getItem(fileKey);
	}

	private async storageSet(addonId: string, key: string, value: unknown): Promise<void> {
		if (!key) {
			throw new Error('storage key required');
		}
		const fileKey = `${ADDON_KV_PREFIX}${addonId}.${sanitizeKey(key)}.json`;
		await this.diskCache.storeItem(fileKey, value);
	}

	private async netFetch(
		manifest: AddonManifest,
		url: string,
		init: { method?: string; headers?: { [key: string]: string }; body?: string | null },
	): Promise<AddonFetchResponse> {
		if (!url || typeof url !== 'string') {
			throw new Error('fetch url required');
		}
		if (!isFetchHostAllowed(manifest, url)) {
			throw new Error(`Host not allowed for fetch: ${url}`);
		}

		const headers = new Headers();
		const incoming = init.headers ?? {};
		for (const [k, v] of Object.entries(incoming)) {
			const lower = k.toLowerCase();
			// Never forward cookies that could authenticate to Firestone domains
			if (lower === 'cookie' || lower === 'set-cookie') {
				continue;
			}
			headers.set(k, v);
		}

		try {
			const response = await fetch(url, {
				method: init.method ?? 'GET',
				headers,
				body: init.body ?? undefined,
			});
			const body = await response.text();
			return {
				ok: response.ok,
				status: response.status,
				statusText: response.statusText,
				body,
			};
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			// Overwolf: target origin must be listed under data.externally_connectable.
			// Without it (or without partner CORS headers), the browser surfaces a generic Failed to fetch.
			throw new Error(
				`net.fetch failed for ${url}: ${message}. ` +
					`If running on Overwolf, ensure the host is listed in overwolf/manifest.json externally_connectable.`,
			);
		}
	}
}

const sanitizeKey = (key: string): string => key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
