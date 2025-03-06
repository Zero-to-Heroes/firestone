/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { OwNotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
	constructor(
		private readonly notifications: OwNotificationsService,
		private readonly i18n: ILocalizationService,
		private readonly ow: OverwolfService,
	) {
		(window as any)['showCriticalError'] = () => this.notifyCriticalError('truncated-logs');
	}

	public async notifyCriticalError(error: GlobalErrorType) {
		const inGame = await this.ow.inGame();
		console.error('[global-error] critical error', error, inGame);
		const { title, message, url } = this.getTexts(error);
		if (inGame) {
			console.debug('[global-error] critical error', title, message, url);
			const onClick = url
				? () => {
						this.ow.openUrlInDefaultBrowser(url);
				  }
				: undefined;
			this.notifications.notifyError(title, message, error, onClick);
		} else if (url) {
			this.ow.openUrlInDefaultBrowser(url);
		}
	}

	private getTexts(error: GlobalErrorType): { title: string; message: string; url?: string | null } {
		switch (error) {
			case 'no-cards':
				return {
					title: this.i18n.translateString('app.global.errors.no-cards.title'),
					message: this.i18n.translateString('app.global.errors.no-cards.message'),
					url: getNoCardsUrl(this.i18n),
				};
			case 'memory-reading':
				return {
					title: this.i18n.translateString('app.global.errors.memory-reading.title'),
					message: this.i18n.translateString('app.global.errors.memory-reading.message'),
					url: getNoMemoryReadingUrl(this.i18n),
				};
			case 'truncated-logs':
				return {
					title: this.i18n.translateString('app.global.errors.truncated-logs.title'),
					message: this.i18n.translateString('app.global.errors.truncated-logs.message'),
					url: getTruncatedLogsUrl(this.i18n),
				};
		}
	}
}

export type GlobalErrorType = 'no-cards' | 'memory-reading' | 'truncated-logs';
export const getNoCardsUrl = (i18n: ILocalizationService): string => {
	switch (i18n.locale) {
		case 'zhCN':
		case 'twCN':
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/no-cards/zhCN.md';
		default:
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/no-cards/enUS.md';
	}
};
export const getNoMemoryReadingUrl = (i18n: ILocalizationService): string => {
	switch (i18n.locale) {
		case 'zhCN':
		case 'twCN':
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/memory-reading/zhCN.md';
		default:
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/memory-reading/enUS.md';
	}
};
export const getTruncatedLogsUrl = (i18n: ILocalizationService): string => {
	switch (i18n.locale) {
		case 'zhCN':
		case 'twCN':
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/truncated-logs/zhCN.md';
		default:
			return 'https://github.com/Zero-to-Heroes/firestone/blob/master/docs/errors/truncated-logs/enUS.md';
	}
};
