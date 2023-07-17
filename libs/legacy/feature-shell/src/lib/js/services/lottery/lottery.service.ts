import { Injectable } from '@angular/core';
import { ApiRunner, CardsFacadeService, LocalStorageService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { LotteryProcessor } from './events/_processor';
import { LotteryCardPlayedProcessor } from './events/lottery-card-played-processor';
import { LotteryDamageWithSpellsProcessor } from './events/lottery-damage-with-spells-processor';
import { LotteryResourcesUpdateProcessor } from './events/lottery-resources-update-processor';
import { LotteryShouldTrackProcessor } from './events/lottery-should-track-processor';
import { LotteryTurnStartProcessor } from './events/lottery-turn-start-processor';
import { LotteryWidgetControllerService } from './lottery-widget-controller.service';
import { LotterySeasonConfig, LotteryState } from './lottery.model';

const LOTTERY_UPDATE_ENDPOINT = `https://6wdoeqq2zemtk7aqnmnhwue5eq0fopzf.lambda-url.us-west-2.on.aws/`;
const LOTTERY_SEASONS_URL = `https://static.zerotoheroes.com/hearthstone/api/data/lottery-seasons.json`;

@Injectable()
export class LotteryService {
	public lottery$$ = new BehaviorSubject<LotteryState | null>(null);

	private parsers: { [eventName: string]: LotteryProcessor } = {
		[GameEvent.RESOURCES_UPDATED]: new LotteryResourcesUpdateProcessor(),
		[GameEvent.TURN_START]: new LotteryTurnStartProcessor(),
		UPDATE_SHOULD_TRACK: new LotteryShouldTrackProcessor(),
		[GameEvent.CARD_PLAYED]: new LotteryCardPlayedProcessor(this.allCards),
		[GameEvent.SECRET_PLAYED]: new LotteryCardPlayedProcessor(this.allCards),
		[GameEvent.QUEST_PLAYED]: new LotteryCardPlayedProcessor(this.allCards),
		[GameEvent.DAMAGE]: new LotteryDamageWithSpellsProcessor(this.allCards),
	};

	private eventsQueue$$ = new BehaviorSubject<GameEvent | null>(null);

	private lotterySeason: string = null;

	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly allCards: CardsFacadeService,
		private readonly widgetController: LotteryWidgetControllerService,
	) {
		window['lotteryProvider'] = this;
		this.init();
	}

	private async init() {
		const lotteryConfig: LotterySeasonConfig = await this.loadLotteryConfig();

		let currentLottery = this.localStorage.getItem<LotteryState>(LocalStorageService.LOTTERY_STATE);
		if (!currentLottery || isPreviousMonth(currentLottery.lastUpdateDate)) {
			currentLottery = LotteryState.create({ lastUpdateDate: new Date().toISOString() }, lotteryConfig);
			this.localStorage.setItem(LocalStorageService.LOTTERY_STATE, currentLottery);
		}
		currentLottery = LotteryState.create(currentLottery, lotteryConfig);
		this.lottery$$.next(currentLottery);

		this.listenToGameEvents();
	}

	private async listenToGameEvents() {
		this.gameEvents.allEvents.subscribe((event) => {
			this.eventsQueue$$.next(event);
		});

		this.widgetController.shouldTrack$$.subscribe((shouldTrack) => {
			this.eventsQueue$$.next({
				type: 'UPDATE_SHOULD_TRACK',
				additionalData: { shouldTrack: shouldTrack },
			} as any);
		});

		this.eventsQueue$$.subscribe((event) => {
			if (!this.lottery$$.value) {
				console.warn('[lottery] no current lottery, ignoring event', event.type);
				return;
			}
			const processor = this.parsers[event.type];
			if (processor) {
				const newLottery = processor.process(this.lottery$$.value, event);
				if (newLottery !== this.lottery$$.value) {
					// console.debug('[lottery] new lottery state', event.type, newLottery, event);
					this.lottery$$.next(newLottery);
				}
			}

			if (event.type === GameEvent.GAME_END) {
				this.confirmLotteryPoints();
			}
		});
	}

	private confirmLotteryPoints() {
		this.localStorage.setItem(LocalStorageService.LOTTERY_STATE, this.lottery$$.value);

		// Get the current month in YYYY-MM format
		const lotteryPoints = this.lottery$$.value.currentPoints();

		// Send the data
		this.api.callPostApiSecure(LOTTERY_UPDATE_ENDPOINT, {
			season: this.lotterySeason,
			points: lotteryPoints,
		});
	}

	private async loadLotteryConfig(): Promise<LotterySeasonConfig> {
		const allSeasons = await this.api.callGetApi<readonly LotterySeasonConfig[]>(LOTTERY_SEASONS_URL);
		console.debug('[lottery] loaded lottery seasons', allSeasons);
		const seasonClosestToNow = allSeasons
			.map((season) => ({ season: season, diff: new Date(season.startDate).getTime() - new Date().getTime() }))
			// Keep only seasons that are in the past
			.filter((season) => season.diff < 0)
			.sort((a, b) => a.diff - b.diff)[0];
		this.lotterySeason = '' + seasonClosestToNow?.season?.id;
		const seasonConfig = seasonClosestToNow?.season ?? allSeasons[0];
		console.debug('[lottery] loaded lottery season config', seasonConfig, seasonClosestToNow);
		return seasonConfig;
	}
}

const isPreviousMonth = (lastUpdateDate: string): boolean => {
	const lastUpdate = new Date(lastUpdateDate);
	const now = new Date();
	return lastUpdate.getMonth() < now.getMonth() && lastUpdate.getFullYear() <= now.getFullYear();
};
