import { ILocalizationService } from './localization.service';

export const getDateAgo = (date: Date, i18n: ILocalizationService): string | null => {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = diff / (1000 * 3600);
	if (hours < 1) {
		return i18n.translateString('global.duration.ago.less-than-an-hour-ago');
	}
	if (hours < 24) {
		return i18n.translateString('global.duration.ago.hours-ago', {
			value: Math.round(hours),
		});
	}
	const days = diff / (1000 * 3600 * 24);
	if (days < 7) {
		return i18n.translateString('global.duration.ago.days-ago', {
			value: Math.round(days),
		});
	}
	return i18n.translateString('global.duration.ago.weeks-ago', {
		value: Math.round(days / 7),
	});
};
