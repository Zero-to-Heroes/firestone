export const ADDON_PERMISSIONS = {
	BATTLEGROUNDS_GAME_END: 'battlegrounds.gameEnd',
	NET_FETCH: 'net.fetch',
	STORAGE: 'storage',
} as const;

export type AddonPermission = (typeof ADDON_PERMISSIONS)[keyof typeof ADDON_PERMISSIONS];

export const ALL_ADDON_PERMISSIONS: readonly AddonPermission[] = Object.values(ADDON_PERMISSIONS);
