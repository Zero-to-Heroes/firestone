import { InjectionToken } from '@angular/core';
import { InternalCardInfo } from '@firestone/collection/data-access';

export const CARDS_MONITOR_EVENT_HANDLER = new InjectionToken<ICardsMonitorEventHandler>(
	'CardsMonitorEventHandler',
);

export interface ICardsMonitorEventHandler {
	onNewPack(setId: string, boosterId: number, packCards: readonly InternalCardInfo[]): void;
}
