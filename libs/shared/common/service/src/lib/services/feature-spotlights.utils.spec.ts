import { FeatureSpotlight } from '../models/feature-spotlight';
import {
	collectSpotlightTargets,
	filterActiveSpotlights,
	filterFeaturedSpotlights,
	getMinorKey,
	getSpotlightBlurbKey,
	getSpotlightTitleKey,
	isSpotlightActive,
	isSpotlightExpired,
	isSpotlightUnseen,
	translateSpotlightField,
} from './feature-spotlights.utils';

const spotlight = (overrides: Partial<FeatureSpotlight> = {}): FeatureSpotlight => ({
	id: 'test',
	shippedMinor: '18.14',
	title: 'Test',
	blurb: 'Blurb',
	target: { prefField: 'bgsEnableDarkGiftOverlay' },
	...overrides,
});

describe('feature-spotlights.utils', () => {
	it('builds a minor key from a patch version', () => {
		expect(getMinorKey('18.14.2')).toBe('18.14');
	});

	it('keeps a spotlight active for the rest of its minor', () => {
		expect(isSpotlightActive(spotlight(), '18.14.0')).toBe(true);
		expect(isSpotlightActive(spotlight(), '18.14.2')).toBe(true);
		expect(isSpotlightExpired('18.14', '18.14.2')).toBe(false);
	});

	it('expires a spotlight at the next minor', () => {
		expect(isSpotlightActive(spotlight(), '18.15.0')).toBe(false);
		expect(isSpotlightExpired('18.14', '18.15.0')).toBe(true);
	});

	it('filters active and featured entries', () => {
		const catalog = [
			spotlight({ id: 'a', featured: true }),
			spotlight({ id: 'b', shippedMinor: '18.13' }),
			spotlight({ id: 'c', featured: true, shippedMinor: '18.12' }),
		];
		expect(filterActiveSpotlights(catalog, '18.14.2').map((s) => s.id)).toEqual(['a']);
		expect(filterFeaturedSpotlights(catalog, '18.14.2').map((s) => s.id)).toEqual(['a']);
	});

	it('tracks unseen ids', () => {
		expect(isSpotlightUnseen('a', [])).toBe(true);
		expect(isSpotlightUnseen('a', ['a'])).toBe(false);
		expect(isSpotlightUnseen('a', undefined)).toBe(true);
	});

	it('collects targets from the catalog', () => {
		const targets = collectSpotlightTargets([
			spotlight({
				target: {
					prefField: 'bgsEnableDarkGiftOverlay',
					settingsNodeId: 'battlegrounds-overlay',
					mainWindowModule: 'battlegrounds',
				},
			}),
		]);
		expect(targets.prefFields.has('bgsEnableDarkGiftOverlay')).toBe(true);
		expect(targets.nodeIds.has('battlegrounds-overlay')).toBe(false);
		expect(targets.modules.has('battlegrounds')).toBe(true);
	});

	it('treats a node id without a pref field as a whole-page spotlight', () => {
		const targets = collectSpotlightTargets([
			spotlight({
				target: {
					settingsNodeId: 'battlegrounds-overlay',
				},
			}),
		]);
		expect(targets.nodeIds.has('battlegrounds-overlay')).toBe(true);
		expect(targets.prefFields.size).toBe(0);
	});

	it('falls back to catalog copy when the i18n key is missing', () => {
		expect(translateSpotlightField((key) => key, getSpotlightTitleKey('test'), 'Fallback title')).toBe(
			'Fallback title',
		);
		expect(translateSpotlightField(() => 'Localized', getSpotlightBlurbKey('test'), 'Fallback')).toBe('Localized');
	});
});
