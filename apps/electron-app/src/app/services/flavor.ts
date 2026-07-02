import { app } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The build flavor of the standalone app.
 * - `standalone`: the free, ad-supported build (default). Lets non-premium users in and serves ads to them.
 * - `standalone-premium`: the premium-only build. No ad-serving code, requires a premium account.
 *
 * The flavor is baked into the bundled package.json `firestoneFlavor` field at build time
 * (see build-tools/replace-version.ts), and read here at runtime.
 */
export type FirestoneFlavor = 'standalone' | 'standalone-premium';

let cachedFlavor: FirestoneFlavor | null = null;

export function getFlavor(): FirestoneFlavor {
	if (cachedFlavor) {
		return cachedFlavor;
	}
	let flavor: string | undefined;
	try {
		const pkgPath = join(app.getAppPath(), 'package.json');
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
		flavor = pkg?.firestoneFlavor;
	} catch (e) {
		console.warn('[flavor] could not read firestoneFlavor from package.json, defaulting to standalone', e);
	}
	// Anything other than the explicit premium flavor falls back to the free build,
	// so an unstamped/placeholder value behaves as the free build.
	cachedFlavor = flavor === 'standalone-premium' ? 'standalone-premium' : 'standalone';
	return cachedFlavor;
}

/** The free, ad-supported build. */
export function isFreeFlavor(): boolean {
	return getFlavor() === 'standalone';
}

/** The premium-only, ad-free build. */
export function isPremiumFlavor(): boolean {
	return getFlavor() === 'standalone-premium';
}
