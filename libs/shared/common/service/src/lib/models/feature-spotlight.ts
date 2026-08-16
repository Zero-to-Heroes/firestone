import { CurrentAppType } from './pref-model';
import { Preferences } from './preferences';

export const FEATURE_SPOTLIGHTS_MEDIA_BASE_URL = 'https://static.firestoneapp.com/features';

export interface FeatureSpotlightTarget {
	readonly settingsNodeId?: string;
	readonly prefField?: keyof Preferences;
	readonly mainWindowModule?: CurrentAppType;
}

export interface FeatureSpotlight {
	readonly id: string;
	/** Minor version this shipped in, e.g. `18.14`. Hidden when the app minor is greater. */
	readonly shippedMinor: string;
	readonly title: string;
	readonly blurb: string;
	readonly target: FeatureSpotlightTarget;
	/** Filename under `docs/features/` / the features CDN. */
	readonly media?: string;
	/** Pin in the latest release-notes modal (max 1–3). */
	readonly featured?: boolean;
}
