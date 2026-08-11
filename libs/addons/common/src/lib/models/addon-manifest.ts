import { AddonPermission } from './addon-permissions';

export type AddonSettingType = 'boolean' | 'string' | 'password' | 'number';

export interface AddonSettingDefinition {
	readonly key: string;
	readonly type: AddonSettingType;
	readonly default?: boolean | string | number;
	readonly label?: string;
	readonly description?: string;
}

export interface AddonManifest {
	readonly id: string;
	readonly name: string;
	readonly version: string;
	readonly main: string;
	readonly description?: string;
	readonly author?: string;
	readonly permissions: readonly AddonPermission[];
	/** Required when permissions include net.fetch. Host rejects other URLs. */
	readonly allowedFetchHosts?: readonly string[];
	readonly settings?: readonly AddonSettingDefinition[];
}

export type AddonRegion = 'NA' | 'EU' | 'AP' | 'CN';

export interface BattlegroundsGameEndPayload {
	readonly playerName: string;
	readonly region: AddonRegion;
	readonly rating: number;
	readonly reviewId?: string;
}

export interface InstalledAddon {
	readonly manifest: AddonManifest;
	readonly folderPath: string;
	readonly mainPath: string;
	readonly enabled: boolean;
	readonly loadError?: string | null;
}

export interface AddonHostState {
	readonly enabledById: { readonly [addonId: string]: boolean };
	readonly settingsById: { readonly [addonId: string]: { readonly [key: string]: boolean | string | number } };
}

export interface AddonFetchRequest {
	readonly url: string;
	readonly method?: string;
	readonly headers?: { readonly [key: string]: string };
	readonly body?: string | null;
}

export interface AddonFetchResponse {
	readonly ok: boolean;
	readonly status: number;
	readonly statusText: string;
	readonly body: string;
}
