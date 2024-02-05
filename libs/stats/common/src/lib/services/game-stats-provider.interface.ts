import { InjectionToken } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { GameStat } from '@firestone/stats/data-access';

export const GAME_STATS_PROVIDER_SERVICE_TOKEN = new InjectionToken<IGameStatsProviderService>(
	'GameStatsProviderService',
);
export interface IGameStatsProviderService {
	gameStats$: SubscriberAwareBehaviorSubject<readonly GameStat[] | null>;
}
