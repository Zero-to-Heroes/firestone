import { hasAddonPermission, isFetchHostAllowed, parseAddonManifest } from './addon-manifest-utils';
import { ADDON_PERMISSIONS } from './addon-permissions';

describe('parseAddonManifest', () => {
	it('parses a valid manifest', () => {
		const manifest = parseAddonManifest(
			{
				id: 'bobs-rush',
				name: "Bob's Rush",
				version: '1.0.0',
				main: 'main.js',
				permissions: ['battlegrounds.gameEnd', 'net.fetch'],
				allowedFetchHosts: ['https://example.com'],
				settings: [{ key: 'enabled', type: 'boolean', default: true }],
			},
			'bobs-rush',
		);
		expect(manifest?.id).toBe('bobs-rush');
		expect(manifest?.permissions).toContain(ADDON_PERMISSIONS.NET_FETCH);
		expect(hasAddonPermission(manifest!, ADDON_PERMISSIONS.BATTLEGROUNDS_GAME_END)).toBe(true);
		expect(isFetchHostAllowed(manifest!, 'https://example.com/api/mmr/update')).toBe(true);
		expect(isFetchHostAllowed(manifest!, 'https://evil.com/api')).toBe(false);
	});

	it('rejects net.fetch without allowedFetchHosts', () => {
		const manifest = parseAddonManifest(
			{
				id: 'bad',
				name: 'Bad',
				version: '1.0.0',
				main: 'main.js',
				permissions: ['net.fetch'],
			},
			'bad',
		);
		expect(manifest).toBeNull();
	});
});
