import { AddonManifest, AddonSettingDefinition } from './addon-manifest';
import { ADDON_PERMISSIONS, AddonPermission, ALL_ADDON_PERMISSIONS } from './addon-permissions';

export const isValidAddonPermission = (value: unknown): value is AddonPermission =>
	typeof value === 'string' && (ALL_ADDON_PERMISSIONS as readonly string[]).includes(value);

export const parseAddonManifest = (raw: unknown, folderName: string): AddonManifest | null => {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const data = raw as Record<string, unknown>;
	const id = typeof data['id'] === 'string' ? data['id'].trim() : '';
	const name = typeof data['name'] === 'string' ? data['name'].trim() : '';
	const version = typeof data['version'] === 'string' ? data['version'].trim() : '';
	const main = typeof data['main'] === 'string' ? data['main'].trim() : 'main.js';
	if (!id || !name || !version || !main) {
		console.warn('[addons] invalid manifest in folder', folderName, 'missing required fields');
		return null;
	}
	if (id !== folderName) {
		console.warn('[addons] manifest id should match folder name', id, folderName);
	}

	const permissionsRaw = Array.isArray(data['permissions']) ? data['permissions'] : [];
	const permissions = permissionsRaw.filter(isValidAddonPermission);
	if (permissions.length !== permissionsRaw.length) {
		console.warn('[addons] manifest has unknown permissions', folderName, permissionsRaw);
	}

	const allowedFetchHosts = Array.isArray(data['allowedFetchHosts'])
		? data['allowedFetchHosts'].filter((h): h is string => typeof h === 'string' && !!h.trim())
		: [];

	if (permissions.includes(ADDON_PERMISSIONS.NET_FETCH) && !allowedFetchHosts.length) {
		console.warn('[addons] net.fetch requires allowedFetchHosts', folderName);
		return null;
	}

	const settings = Array.isArray(data['settings'])
		? data['settings'].map(parseSettingDefinition).filter((s): s is AddonSettingDefinition => !!s)
		: [];

	return {
		id,
		name,
		version,
		main,
		description: typeof data['description'] === 'string' ? data['description'] : undefined,
		author: typeof data['author'] === 'string' ? data['author'] : undefined,
		permissions,
		allowedFetchHosts,
		settings,
	};
};

const parseSettingDefinition = (raw: unknown): AddonSettingDefinition | null => {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const data = raw as Record<string, unknown>;
	const key = typeof data['key'] === 'string' ? data['key'].trim() : '';
	const type = data['type'];
	if (!key || (type !== 'boolean' && type !== 'string' && type !== 'password' && type !== 'number')) {
		return null;
	}
	return {
		key,
		type,
		default: data['default'] as boolean | string | number | undefined,
		label: typeof data['label'] === 'string' ? data['label'] : undefined,
		description: typeof data['description'] === 'string' ? data['description'] : undefined,
	};
};

export const hasAddonPermission = (manifest: AddonManifest, permission: AddonPermission): boolean =>
	manifest.permissions.includes(permission);

export const isFetchHostAllowed = (manifest: AddonManifest, url: string): boolean => {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		return false;
	}
	const origin = parsed.origin;
	return (manifest.allowedFetchHosts ?? []).some((allowed) => {
		try {
			const allowedUrl = new URL(allowed);
			return allowedUrl.origin === origin;
		} catch {
			return allowed === origin || url.startsWith(allowed);
		}
	});
};
