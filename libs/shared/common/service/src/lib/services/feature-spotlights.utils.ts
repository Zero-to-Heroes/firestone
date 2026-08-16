import { CurrentAppType } from '../models/pref-model';
import {
	FEATURE_SPOTLIGHTS_MEDIA_BASE_URL,
	FeatureSpotlight,
	FeatureSpotlightTarget,
} from '../models/feature-spotlight';
import { Preferences } from '../models/preferences';

export interface SpotlightTargets {
	readonly prefFields: ReadonlySet<string>;
	readonly nodeIds: ReadonlySet<string>;
	readonly modules: ReadonlySet<CurrentAppType>;
}

export const getMinorKey = (version: string): string => {
	const parts = version.split('.');
	return `${parts[0]}.${parts[1]}`;
};

const minorSortValue = (minorKey: string): number => {
	const [major, minor] = minorKey.split('.').map((part) => parseInt(part, 10) || 0);
	return major * 1000 + minor;
};

/** True when current app minor is greater than the shipped minor (`18.14.x` expires at `18.15.0`). */
export const isSpotlightExpired = (shippedMinor: string, currentVersion: string): boolean => {
	return minorSortValue(getMinorKey(currentVersion)) > minorSortValue(shippedMinor);
};

export const isSpotlightActive = (spotlight: FeatureSpotlight, currentVersion: string): boolean => {
	return !isSpotlightExpired(spotlight.shippedMinor, currentVersion);
};

export const filterActiveSpotlights = (
	spotlights: readonly FeatureSpotlight[],
	currentVersion: string,
): readonly FeatureSpotlight[] => {
	return spotlights.filter((spotlight) => isSpotlightActive(spotlight, currentVersion));
};

export const filterFeaturedSpotlights = (
	spotlights: readonly FeatureSpotlight[],
	currentVersion: string,
): readonly FeatureSpotlight[] => {
	return filterActiveSpotlights(spotlights, currentVersion)
		.filter((spotlight) => spotlight.featured)
		.slice(0, 3);
};

export const isSpotlightUnseen = (spotlightId: string, seenIds: readonly string[] | null | undefined): boolean => {
	return !(seenIds ?? []).includes(spotlightId);
};

export const collectSpotlightTargets = (spotlights: readonly FeatureSpotlight[]): SpotlightTargets => {
	const prefFields = new Set<string>();
	const nodeIds = new Set<string>();
	const modules = new Set<CurrentAppType>();
	for (const spotlight of spotlights) {
		if (spotlight.target.prefField) {
			prefFields.add(spotlight.target.prefField);
		} else if (spotlight.target.settingsNodeId) {
			nodeIds.add(spotlight.target.settingsNodeId);
		}
		if (spotlight.target.mainWindowModule) {
			modules.add(spotlight.target.mainWindowModule);
		}
	}
	return { prefFields, nodeIds, modules };
};

export const findSpotlightForPrefField = (
	spotlights: readonly FeatureSpotlight[],
	field: keyof Preferences | string | undefined,
): FeatureSpotlight | undefined => {
	if (!field) {
		return undefined;
	}
	return spotlights.find((spotlight) => spotlight.target.prefField === field);
};

export const findSpotlightsForNodeId = (
	spotlights: readonly FeatureSpotlight[],
	nodeId: string | undefined,
): readonly FeatureSpotlight[] => {
	if (!nodeId) {
		return [];
	}
	return spotlights.filter((spotlight) => spotlight.target.settingsNodeId === nodeId);
};

export const findSpotlightsForModule = (
	spotlights: readonly FeatureSpotlight[],
	module: CurrentAppType | string | undefined,
): readonly FeatureSpotlight[] => {
	if (!module) {
		return [];
	}
	return spotlights.filter((spotlight) => spotlight.target.mainWindowModule === module);
};

export const getSpotlightTitleKey = (id: string): string => `app.feature-spotlights.${id}.title`;

export const getSpotlightBlurbKey = (id: string): string => `app.feature-spotlights.${id}.blurb`;

export const translateSpotlightField = (translate: (key: string) => string, key: string, fallback: string): string => {
	const translated = translate(key);
	if (!translated || translated === key) {
		return fallback;
	}
	return translated;
};

export const getFeatureSpotlightMediaUrl = (file: string): string => {
	return `${FEATURE_SPOTLIGHTS_MEDIA_BASE_URL}/${file}`;
};

export const resolveSpotlightMediaFile = (spotlight: FeatureSpotlight): string => {
	return spotlight.media ?? `${spotlight.id}.png`;
};

export const getFeatureSpotlightMediaType = (file: string): 'image' | 'video' => {
	const ext = file.split('.').pop()?.toLowerCase();
	if (ext === 'webm' || ext === 'mp4' || ext === 'mov') {
		return 'video';
	}
	return 'image';
};

const escapeHtml = (value: string): string => {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

export const buildSpotlightTooltipHtml = (spotlight: FeatureSpotlight, blurb?: string): string => {
	return `<div class="spotlight-tooltip"><div class="spotlight-blurb">${escapeHtml(blurb ?? spotlight.blurb)}</div></div>`;
};

export const matchesSpotlightTarget = (
	target: FeatureSpotlightTarget,
	options: { prefField?: string; nodeId?: string; module?: string },
): boolean => {
	if (options.prefField && target.prefField === options.prefField) {
		return true;
	}
	if (options.nodeId && target.settingsNodeId === options.nodeId) {
		return true;
	}
	if (options.module && target.mainWindowModule === options.module) {
		return true;
	}
	return false;
};
