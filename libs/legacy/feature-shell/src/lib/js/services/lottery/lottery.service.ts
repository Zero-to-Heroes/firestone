import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { LotteryProcessor } from './events/_processor';
import { LotteryResourcesUpdateProcessor } from './events/lottery-resources-update-processor';
import { LotteryTurnStartProcessor } from './events/lottery-turn-start-processor';
import { LotteryVisibilityProcessor } from './events/lottery-visibility-processor';
import { LotteryState } from './lottery.model';

@Injectable()
export class LotteryService {
	public lottery$$ = new BehaviorSubject<LotteryState>(null);

	private parsers: { [eventName: string]: LotteryProcessor } = {
		[GameEvent.RESOURCES_UPDATED]: new LotteryResourcesUpdateProcessor(),
		[GameEvent.TURN_START]: new LotteryTurnStartProcessor(),
		UPDATE_VISIBILITY: new LotteryVisibilityProcessor(),
	};

	private eventsQueue$$ = new BehaviorSubject<GameEvent | null>(null);

	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {
		window['lotteryProvider'] = this;
		this.init();
	}

	private async init() {
		let currentLottery = this.localStorage.getItem<LotteryState>(LocalStorageService.LOTTERY_STATE);
		if (!currentLottery || isPreviousMonth(currentLottery.lastUpdateDate)) {
			currentLottery = LotteryState.create({ lastUpdateDate: new Date().toISOString() });
			this.localStorage.setItem(LocalStorageService.LOTTERY_STATE, currentLottery);
		}
		currentLottery = LotteryState.create(currentLottery);

		const prefs = await this.prefs.getPreferences();
		console.debug('[lottery] current lottery', currentLottery, prefs.showLottery);
		const updatedLottery = currentLottery.update({
			visible: prefs.showLottery,
		});
		this.lottery$$.next(updatedLottery);

		this.listenToGameEvents();
	}

	private async listenToGameEvents() {
		this.gameEvents.allEvents.subscribe((event) => {
			this.eventsQueue$$.next(event);
		});

		this.eventsQueue$$.subscribe((event) => {
			if (!this.lottery$$.value) {
				console.warn('[lottery] no current lottery, ignoring event', event.type);
				return;
			}
			const processor = this.parsers[event.type];
			if (processor) {
				const newLottery = processor.process(this.lottery$$.value, event);
				console.debug(
					'[lottery] new lottery state',
					event.type,
					newLottery !== this.lottery$$.value,
					newLottery,
				);
				if (newLottery !== this.lottery$$.value) {
					this.lottery$$.next(newLottery);
				}
			}

			if (event.type === GameEvent.GAME_END) {
				this.localStorage.setItem(LocalStorageService.LOTTERY_STATE, this.lottery$$.value);
			}
		});

		await this.store.initComplete();
		combineLatest([
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenPrefs$((prefs) => prefs.showLottery),
			this.store.enablePremiumFeatures$(),
		])
			.pipe(
				map(([[currentScene], [showLottery], isPremium]) => {
					const visible =
						currentScene === SceneMode.GAMEPLAY &&
						// Check for null so that by default it doesn't show up for premium users
						((!isPremium && showLottery === null) || (isPremium && showLottery === true));
					return visible;
				}),
				distinctUntilChanged(),
			)
			.subscribe((showLottery) => {
				this.eventsQueue$$.next({ type: 'UPDATE_VISIBILITY', additionalData: { visible: showLottery } } as any);
			});
	}
}

const isPreviousMonth = (lastUpdateDate: string): boolean => {
	const lastUpdate = new Date(lastUpdateDate);
	const now = new Date();
	return lastUpdate.getMonth() < now.getMonth() && lastUpdate.getFullYear() <= now.getFullYear();
};
