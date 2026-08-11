/** Durable user folder for drop-in add-ons (survives Firestone / Overwolf updates). */
export const ADDONS_FOLDER_SEGMENTS = ['Firestone', 'Addons'] as const;

/**
 * Resolves Windows %APPDATA% (Roaming), e.g. C:\Users\<user>\AppData\Roaming.
 */
export const getAppDataRootPath = (): string => {
	try {
		const appData = (globalThis as any)?.process?.env?.APPDATA;
		if (typeof appData === 'string' && appData.length) {
			return appData;
		}
	} catch {
		// ignore
	}

	try {
		const owPaths = (globalThis as any)?.overwolf?.io?.paths;
		if (typeof owPaths?.roamingAppData === 'string' && owPaths.roamingAppData.length) {
			return owPaths.roamingAppData;
		}
		if (typeof owPaths?.localAppData === 'string' && owPaths.localAppData.length) {
			// ...\AppData\Local -> ...\AppData\Roaming
			const roaming = owPaths.localAppData.replace(/\\AppData\\Local$/i, '\\AppData\\Roaming');
			if (roaming !== owPaths.localAppData) {
				return roaming;
			}
		}
	} catch {
		// ignore
	}

	try {
		const localAppData = (globalThis as any)?.process?.env?.LOCALAPPDATA;
		if (typeof localAppData === 'string' && localAppData.length) {
			const roaming = localAppData.replace(/\\AppData\\Local$/i, '\\AppData\\Roaming');
			if (roaming !== localAppData) {
				return roaming;
			}
		}
	} catch {
		// ignore
	}

	try {
		const userProfile = (globalThis as any)?.process?.env?.USERPROFILE;
		if (typeof userProfile === 'string' && userProfile.length) {
			return `${userProfile}\\AppData\\Roaming`;
		}
	} catch {
		// ignore
	}

	return 'AppData\\Roaming';
};

export const getAddonsRootPath = (): string => {
	const appData = getAppDataRootPath();
	return `${appData}\\${ADDONS_FOLDER_SEGMENTS.join('\\')}`;
};

export const joinPath = (...parts: string[]): string =>
	parts
		.filter((p) => !!p?.length)
		.map((p, i) => (i === 0 ? p.replace(/[\\/]+$/, '') : p.replace(/^[\\/]+/, '').replace(/[\\/]+$/, '')))
		.join('\\');
