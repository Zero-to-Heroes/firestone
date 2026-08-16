import { FeatureSpotlight } from './feature-spotlight';

/**
 * In-app feature discovery catalog. Written with the release notes (see
 * libs/shared/assets/src/assets/app-versions/README.md).
 *
 * - `id`: stable, prefer the pref field or settings node id
 * - `shippedMinor`: `major.minor` (e.g. `18.14`); expires at the next minor
 * - `title` / `blurb`: English fallback; localized copy lives in
 *   `app.feature-spotlights.{id}.title` / `.blurb` (auto-translated for other locales)
 * - `target.prefField` / `settingsNodeId` / `mainWindowModule`: where NEW appears
 * - `media`: PNG filename in docs/features/ (uploaded to the features CDN)
 */
export const FEATURE_SPOTLIGHTS: readonly FeatureSpotlight[] = [
	{
		id: 'bgsEnableDarkGiftOverlay',
		shippedMinor: '18.14',
		featured: true,
		title: 'Dark Gifts tooltip',
		blurb: 'Mouse over the Dark Gifts button to see which minions you can get, and which Dark Gifts any given minion can get.',
		target: {
			settingsNodeId: 'battlegrounds-overlay',
			prefField: 'bgsEnableDarkGiftOverlay',
		},
	},
];
