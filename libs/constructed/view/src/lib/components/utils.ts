import { MulliganPersonalMinGames } from '@firestone/constructed/common';
import { ILocalizationService } from '@firestone/shared/framework/core';

export const buildColor = (
	goodColor: string,
	badColor: string,
	value: number | null,
	maxGood: number,
	minBad: number,
	debug?,
): string => {
	if (value === null) {
		return badColor;
	}

	const percentage = Math.max(0, Math.min(1, (value - minBad) / (maxGood - minBad)));
	const color = interpolateColors(badColor, goodColor, percentage, debug);
	return color;
};

export const personalMulliganChartFields = (
	advice: {
		personalKeepRate?: number | null;
		personalScore?: number | null;
	},
	showBoth: boolean,
) => ({
	showBoth,
	personalKeepRate: advice.personalKeepRate == null ? null : 100 * advice.personalKeepRate,
	personalValue: advice.personalScore ?? null,
	personalKeptColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', advice.personalKeepRate ?? 0, 0.6, 0.4),
	personalImpactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', advice.personalScore ?? 0, 4, -4),
});

export const formatMulliganSampleSize = (
	i18n: ILocalizationService,
	info: {
		sampleSize: number;
		personalSampleSize?: number;
		communitySampleSize?: number;
		statsSource?: string;
	},
): string => {
	if (info.statsSource === 'both') {
		return i18n.translateString(`decktracker.overlay.mulligan.sample-size-both`, {
			community: (info.communitySampleSize ?? info.sampleSize).toLocaleString(
				i18n.formatCurrentLocale() ?? 'enUS',
			),
			personal: (info.personalSampleSize ?? 0).toLocaleString(i18n.formatCurrentLocale() ?? 'enUS'),
		})!;
	}
	return i18n.translateString(`app.decktracker.filters.sample-size-filter`, {
		value: info.sampleSize.toLocaleString(i18n.formatCurrentLocale() ?? 'enUS'),
	})!;
};

export const formatMulliganSampleSizeTooltip = (
	i18n: ILocalizationService,
	statsSource: string | null | undefined,
): string => {
	if (statsSource === 'personal') {
		return i18n.translateString('decktracker.overlay.mulligan.sample-size-tooltip-personal');
	}
	if (statsSource === 'both') {
		return i18n.translateString('decktracker.overlay.mulligan.sample-size-tooltip-both');
	}
	return i18n.translateString('decktracker.overlay.mulligan.sample-size-tooltip');
};

export const formatPersonalMinGamesWarningTooltip = (
	i18n: ILocalizationService,
	info: {
		personalBelowMinGames?: boolean;
		personalSampleSize?: number;
		personalMinGames?: MulliganPersonalMinGames | null;
	},
): string | null => {
	if (!info.personalBelowMinGames) {
		return null;
	}
	const pref = info.personalMinGames ?? '25';
	if (pref === 'never') {
		return i18n.translateString('decktracker.overlay.mulligan.personal-min-games-warning-never');
	}
	const threshold = pref === 'always' ? 1 : Number(pref);
	return i18n.translateString('decktracker.overlay.mulligan.personal-min-games-warning', {
		current: info.personalSampleSize ?? 0,
		threshold,
	});
};

const interpolateColors = (color1Hsl: string, color2Hsl: string, percentage: number, debug): string => {
	const h1 = parseInt(color1Hsl.substring(4, color1Hsl.indexOf(',')), 10);
	const s1 = parseInt(color1Hsl.substring(color1Hsl.indexOf(',') + 1, color1Hsl.lastIndexOf(',')), 10);
	const l1 = parseInt(color1Hsl.substring(color1Hsl.lastIndexOf(',') + 1, color1Hsl.length - 1), 10);
	const h2 = parseInt(color2Hsl.substring(4, color2Hsl.indexOf(',')), 10);
	const s2 = parseInt(color2Hsl.substring(color2Hsl.indexOf(',') + 1, color2Hsl.lastIndexOf(',')), 10);
	const l2 = parseInt(color2Hsl.substring(color2Hsl.lastIndexOf(',') + 1, color2Hsl.length - 1), 10);
	const h = h1 + Math.round((h2 - h1) * percentage);
	const s = s1 + Math.round((s2 - s1) * percentage);
	const l = l1 + Math.round((l2 - l1) * percentage);
	return `hsl(${h}, ${s}%, ${l}%)`;
};
