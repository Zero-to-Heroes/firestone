import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../models/mainwindow/navigation';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsLocalStorageService } from '../../achievement/achievements-local-storage.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { AchievementsLoaderService } from '../../achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from '../../achievement/remote-achievements.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { IndexedDbService } from '../../collection/indexed-db.service';
import { PackHistoryService } from '../../collection/pack-history.service';
import { DecksStateBuilderService } from '../../decktracker/main/decks-state-builder.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../decktracker/main/replays-state-builder.service';
import { Events } from '../../events.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { OwNotificationsService } from '../../notifications.service';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { ProcessingQueue } from '../../processing-queue.service';
import { SetsService } from '../../sets-service.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../stats/game/game-stats-updater.service';
import { UserService } from '../../user.service';
import { AchievementCompletedEvent } from './events/achievements/achievement-completed-event';
import { AchievementHistoryCreatedEvent } from './events/achievements/achievement-history-created-event';
import { AchievementRecordedEvent } from './events/achievements/achievement-recorded-event';
import { AchievementsInitEvent } from './events/achievements/achievements-init-event';
import { ChangeAchievementsActiveFilterEvent } from './events/achievements/change-achievements-active-filter-event';
import { ChangeVisibleAchievementEvent } from './events/achievements/change-visible-achievement-event';
import { FilterShownAchievementsEvent } from './events/achievements/filter-shown-achievements-event';
import { SelectAchievementCategoryEvent } from './events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from './events/achievements/select-achievement-set-event';
import { ShowAchievementDetailsEvent } from './events/achievements/show-achievement-details-event';
import { VideoReplayDeletionRequestEvent } from './events/achievements/video-replay-deletion-request-event';
import { ChangeVisibleApplicationEvent } from './events/change-visible-application-event';
import { CloseMainWindowEvent } from './events/close-main-window-event';
import { CollectionInitEvent } from './events/collection/collection-init-event';
import { CollectionSetsFilterEvent } from './events/collection/collection-sets-filter-event';
import { LoadMoreCardHistoryEvent } from './events/collection/load-more-card-history-event';
import { NewCardEvent } from './events/collection/new-card-event';
import { NewPackEvent } from './events/collection/new-pack-event';
import { SearchCardsEvent } from './events/collection/search-cards-event';
import { SelectCollectionFormatEvent } from './events/collection/select-collection-format-event';
import { SelectCollectionSetEvent } from './events/collection/select-collection-set-event';
import { ShowCardDetailsEvent } from './events/collection/show-card-details-event';
import { ToggleShowOnlyNewCardsInHistoryEvent } from './events/collection/toggle-show-only-new-cards-in-history-event';
import { UpdateCardSearchResultsEvent } from './events/collection/update-card-search-results-event';
import { CurrentUserEvent } from './events/current-user-event';
import { ChangeDeckModeFilterEvent } from './events/decktracker/change-deck-mode-filter-event';
import { SelectDecksViewEvent } from './events/decktracker/select-decks-view-event';
import { NextFtueEvent } from './events/ftue/next-ftue-event';
import { PreviousFtueEvent } from './events/ftue/previous-ftue-event';
import { SkipFtueEvent } from './events/ftue/skip-ftue-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { NavigationBackEvent } from './events/navigation/navigation-back-event';
import { NavigationNextEvent } from './events/navigation/navigation-next-event';
import { PopulateStoreEvent } from './events/populate-store-event';
import { RecomputeReplaysEvent } from './events/replays/recompute-replays-event';
import { ReplaysFilterEvent } from './events/replays/replays-filter-event';
import { ShowReplayEvent } from './events/replays/show-replay-event';
import { ShowMainWindowEvent } from './events/show-main-window-event';
import { CloseSocialShareModalEvent } from './events/social/close-social-share-modal-event';
import { ShareVideoOnSocialNetworkEvent } from './events/social/share-video-on-social-network-event';
import { StartSocialSharingEvent } from './events/social/start-social-sharing-event';
import { TriggerSocialNetworkLoginToggleEvent } from './events/social/trigger-social-network-login-toggle-event';
import { UpdateTwitterSocialInfoEvent } from './events/social/update-twitter-social-info-event';
import { GameStatsInitEvent } from './events/stats/game-stats-init-event';
import { GlobalStatsInitEvent } from './events/stats/global/global-stats-init-event';
import { GlobalStatsUpdatedEvent } from './events/stats/global/global-stats-updated-event';
import { RecomputeGameStatsEvent } from './events/stats/recompute-game-stats-event';
import { TriggerPopulateStoreEvent } from './events/trigger-populate-store-event';
import { AchievementStateHelper } from './helper/achievement-state-helper';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';
import { AchievementCompletedProcessor } from './processors/achievements/achievement-completed-processor';
import { AchievementHistoryCreatedProcessor } from './processors/achievements/achievement-history-created-processor';
import { AchievementRecordedProcessor } from './processors/achievements/achievement-recorded-processor';
import { AchievementsInitProcessor } from './processors/achievements/achievements-init-processor';
import { ChangeAchievementsActiveFilterProcessor } from './processors/achievements/change-achievements-active-filter-processor';
import { ChangeVisibleAchievementProcessor } from './processors/achievements/change-visible-achievement-processor';
import { FilterShownAchievementsProcessor } from './processors/achievements/filter-shown-achievements-processor';
import { SelectAchievementCategoryProcessor } from './processors/achievements/select-achievement-category-processor';
import { SelectAchievementSetProcessor } from './processors/achievements/select-achievement-set-processor';
import { ShowAchievementDetailsProcessor } from './processors/achievements/show-achievement-details-processor';
import { VideoReplayDeletionRequestProcessor } from './processors/achievements/video-replay-deletion-request-processor';
import { ChangeVisibleApplicationProcessor } from './processors/change-visible-application-processor';
import { CloseMainWindowProcessor } from './processors/close-main-window-processor';
import { CollectionInitProcessor } from './processors/collection/collection-init-processor';
import { CollectionSetsFilterProcessor } from './processors/collection/collection-sets-filter-processor';
import { LoadMoreCardHistoryProcessor } from './processors/collection/load-more-card-history-processor';
import { NewCardProcessor } from './processors/collection/new-card-processor';
import { NewPackProcessor } from './processors/collection/new-pack-processor';
import { SearchCardProcessor } from './processors/collection/search-card-processor';
import { SelectCollectionFormatProcessor } from './processors/collection/select-collection-format-processor';
import { SelectCollectionSetProcessor } from './processors/collection/select-collection-set-processor';
import { ShowCardDetailsProcessor } from './processors/collection/show-card-details-processor';
import { ToggleShowOnlyNewCardsInHistoryProcessor } from './processors/collection/toggle-show-only-new-cards-in-history-processor';
import { UpdateCardSearchResultsProcessor } from './processors/collection/update-card-search-results-processor';
import { CurrentUserProcessor } from './processors/current-user-process.ts';
import { ChangeDeckModeFilterProcessor } from './processors/decktracker/change-deck-mode-filter-processor';
import { SelectDeckViewProcessor } from './processors/decktracker/select-decks-view-processor';
import { NextFtueProcessor } from './processors/ftue/next-ftue-processor';
import { PreviousFtueProcessor } from './processors/ftue/previous-ftue-processor';
import { SkipFtueProcessor } from './processors/ftue/skip-ftue-processor';
import { NavigationBackProcessor } from './processors/navigation/navigation-back-processor';
import { NavigationNextProcessor } from './processors/navigation/navigation-next-processor';
import { PopulateStoreProcessor } from './processors/populate-store-processor';
import { Processor } from './processors/processor';
import { RecomputeReplaysProcessor } from './processors/replays/recompute-replays-processor';
import { ReplaysFilterProcessor } from './processors/replays/replays-filter-processor';
import { ShowReplayProcessor } from './processors/replays/show-replay-processor';
import { ShowMainWindowProcessor } from './processors/show-main-window-processor';
import { CloseSocialShareModalProcessor } from './processors/social/close-social-share-modal-processor';
import { ShareVideoOnSocialNetworkProcessor } from './processors/social/share-video-on-social-network-processor';
import { StartSocialSharingProcessor } from './processors/social/start-social-sharing-processor';
import { TriggerSocialNetworkLoginToggleProcessor } from './processors/social/trigger-social-network-login-toggle-processor';
import { UpdateTwitterSocialInfoProcessor } from './processors/social/update-twitter-social-info-processor';
import { GameStatsInitProcessor } from './processors/stats/game-stats-init-processor';
import { GlobalStatsInitProcessor } from './processors/stats/global/global-stats-init-processor';
import { GlobalStatsUpdatedProcessor } from './processors/stats/global/global-stats-updated-processor';
import { RecomputeGameStatsProcessor } from './processors/stats/recompute-game-stats-processor';
import { TriggerPopulateStoreProcessor } from './processors/trigger-populate-store-processor';
import { StateHistory } from './state-history';

declare let amplitude;

const MAX_HISTORY_SIZE = 30;

@Injectable()
export class MainWindowStoreService {
	public stateUpdater = new EventEmitter<MainWindowStoreEvent>();
	public state: MainWindowState = new MainWindowState();

	private stateEmitter = new BehaviorSubject<MainWindowState>(this.state);
	private processors: Map<string, Processor>;

	private stateHistory: readonly StateHistory[] = [];

	private processingQueue = new ProcessingQueue<MainWindowStoreEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'main-window-store',
	);

	constructor(
		private cards: AllCardsService,
		private sets: SetsService,
		private achievementsRepository: AchievementsRepository,
		private collectionManager: CollectionManager,
		private cardHistoryStorage: CardHistoryStorageService,
		private achievementsStorage: AchievementsLocalStorageService,
		private achievementHistoryStorage: AchievementHistoryStorageService,
		private achievementsLoader: AchievementsLoaderService,
		private remoteAchievements: RemoteAchievementsService,
		private collectionDb: IndexedDbService,
		private gameStatsUpdater: GameStatsUpdaterService,
		private gameStatsLoader: GameStatsLoaderService,
		private ow: OverwolfService,
		private memoryReading: MemoryInspectionService,
		private events: Events,
		private pityTimer: PackHistoryService,
		private notifs: OwNotificationsService,
		private userService: UserService,
		private decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly logger: NGXLogger,
		private readonly globalStats: GlobalStatsService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly decksStateBuilder: DecksStateBuilderService,
	) {
		this.userService.init(this);
		window['mainWindowStore'] = this.stateEmitter;
		window['mainWindowStoreUpdater'] = this.stateUpdater;
		this.gameStatsUpdater.stateUpdater = this.stateUpdater;

		this.processors = this.buildProcessors();

		this.stateUpdater.subscribe((event: MainWindowStoreEvent) => {
			// console.log('[store] enqueuing event', event);
			this.processingQueue.enqueue(event);
		});

		this.ow.addGameInfoUpdatedListener((res: any) => {
			if (this.ow.gameLaunched(res)) {
				console.log('[store] game launched, populating store', res);
				// Do both so that it's hidden right away
				this.ow.hideCollectionWindow();
				this.stateUpdater.next(new CloseMainWindowEvent());
				this.populateStore();
			}
		});
		this.populateStore();

		this.listenForSocialAccountLoginUpdates();
	}

	private async processQueue(eventQueue: readonly MainWindowStoreEvent[]): Promise<readonly MainWindowStoreEvent[]> {
		const event = eventQueue[0];
		console.log('[store] processing event', event.eventName());
		const start = Date.now();
		const processor: Processor = this.processors.get(event.eventName());
		if (!processor) {
			this.logger.error('[store] missing processor for event', event.eventName());
			return;
		}
		// Don't modify the current state here, as it could make state lookup impossible
		// (for back / forward arrows for instance)
		try {
			const newState = await processor.process(event, this.state, this.stateHistory);
			if (newState) {
				this.addStateToHistory(newState, event);
				this.state = newState;
				// We don't want to store the status of the navigation arrows, as when going back
				// or forward with the history arrows, the state of these arrows will change
				// vs what they originally were when the state was stored
				const stateWithNavigation = this.updateNavigationArrows(newState);
				// console.log('emitting new state', stateWithNavigation);
				this.stateEmitter.next(stateWithNavigation);
				if (Date.now() - start > 1000) {
					this.logger.warn(
						'[store] Event',
						event.eventName(),
						'processing took too long, consider splitting it',
						Date.now() - start,
					);
				}
			} else {
				console.log('[store] no new state to emit');
			}
		} catch (e) {
			console.error('[store] exception while processing event', event.eventName(), event, processor, e);
		}
		return eventQueue.slice(1);
	}

	private addStateToHistory(newState: MainWindowState, originalEvent: MainWindowStoreEvent): void {
		const navigation = originalEvent.isNavigationEvent();
		const event = originalEvent.eventName();
		// Because the history stores the state + the navigation state
		// If we go back in time, we will override the current state with a past state
		// and this can cause some info to disappear until we restart the app
		// So all events that cause an actual update to the state data should
		// reset the history, until we have a better solution
		const isResetHistory = originalEvent.isResetHistoryEvent();
		if (isResetHistory) {
			this.stateHistory = [];
		}
		const newIndex = this.stateHistory.map(state => state.state).indexOf(newState);
		// console.log('newIndex', newIndex, this.stateHistory);
		// We just did a "next" or "previous", so we don't modify the history
		if (newIndex !== -1) {
			// console.log('[store] moving through history, so not modifying history', newIndex);
			return;
		} else {
			if (navigation) {
				amplitude.getInstance().logEvent('navigation', {
					'event': event,
				});
			}
			// Build a new history with the current state as tail
			const currentIndex = this.stateHistory.map(state => state.state).indexOf(this.state);
			const historyTrunk = this.stateHistory.slice(0, currentIndex + 1);
			const newHistory = {
				event: event,
				navigation: navigation,
				state: newState,
			} as StateHistory;
			this.stateHistory = [...historyTrunk, newHistory];
		}
		if (this.stateHistory.length > MAX_HISTORY_SIZE) {
			this.stateHistory = this.stateHistory.slice(1);
		}
	}

	private updateNavigationArrows(state: MainWindowState): MainWindowState {
		const targetIndex = NavigationBackProcessor.getTargetIndex(state, this.stateHistory);
		const backArrowEnabled =
			(targetIndex !== -1 && this.stateHistory[targetIndex].state.currentApp === state.currentApp) ||
			NavigationBackProcessor.buildParentState(state) != null;
		// const backArrowEnabled = NavigationBackProcessor.buildParentState(state) != null;
		const nextArrowEnabled = NavigationNextProcessor.getTargetIndex(state, this.stateHistory) !== -1;

		// console.log('navigation arrows', backArrowEnabled, nextArrowEnabled, this.stateHistory);
		const newNavigation: Navigation = Object.assign(new Navigation(), state.navigation, {
			backArrowEnabled: backArrowEnabled,
			nextArrowEnabled: nextArrowEnabled,
		} as Navigation);
		return Object.assign(new MainWindowState(), state, {
			navigation: newNavigation,
		} as MainWindowState);
	}

	private buildProcessors(): Map<string, Processor> {
		const achievementStateHelper = new AchievementStateHelper();
		const achievementUpdateHelper = new AchievementUpdateHelper(
			this.achievementsRepository,
			achievementStateHelper,
		);
		return Map.of(
			TriggerPopulateStoreEvent.eventName(),
			new TriggerPopulateStoreProcessor(this.events),

			PopulateStoreEvent.eventName(),
			new PopulateStoreProcessor(this.ow, this.userService, this.prefs),

			NavigationBackEvent.eventName(),
			new NavigationBackProcessor(),

			NavigationNextEvent.eventName(),
			new NavigationNextProcessor(),

			ChangeVisibleApplicationEvent.eventName(),
			new ChangeVisibleApplicationProcessor(),

			CloseMainWindowEvent.eventName(),
			new CloseMainWindowProcessor(),

			ShowMainWindowEvent.eventName(),
			new ShowMainWindowProcessor(),

			CurrentUserEvent.eventName(),
			new CurrentUserProcessor(),

			// Collection
			CollectionInitEvent.eventName(),
			new CollectionInitProcessor(),

			CollectionSetsFilterEvent.eventName(),
			new CollectionSetsFilterProcessor(),

			SearchCardsEvent.eventName(),
			new SearchCardProcessor(this.collectionManager, this.sets),

			LoadMoreCardHistoryEvent.eventName(),
			new LoadMoreCardHistoryProcessor(this.cardHistoryStorage),

			SelectCollectionFormatEvent.eventName(),
			new SelectCollectionFormatProcessor(),

			SelectCollectionSetEvent.eventName(),
			new SelectCollectionSetProcessor(),

			ShowCardDetailsEvent.eventName(),
			new ShowCardDetailsProcessor(this.cards),

			ToggleShowOnlyNewCardsInHistoryEvent.eventName(),
			new ToggleShowOnlyNewCardsInHistoryProcessor(),

			UpdateCardSearchResultsEvent.eventName(),
			new UpdateCardSearchResultsProcessor(this.collectionManager, this.sets),

			NewPackEvent.eventName(),
			new NewPackProcessor(this.collectionDb, this.cards),

			NewCardEvent.eventName(),
			new NewCardProcessor(
				this.collectionDb,
				this.memoryReading,
				this.cardHistoryStorage,
				this.pityTimer,
				this.sets,
			),

			// Achievements
			AchievementsInitEvent.eventName(),
			new AchievementsInitProcessor(),

			ChangeAchievementsActiveFilterEvent.eventName(),
			new ChangeAchievementsActiveFilterProcessor(),

			AchievementHistoryCreatedEvent.eventName(),
			new AchievementHistoryCreatedProcessor(this.achievementHistoryStorage, this.achievementsLoader),

			ChangeVisibleAchievementEvent.eventName(),
			new ChangeVisibleAchievementProcessor(),

			SelectAchievementCategoryEvent.eventName(),
			new SelectAchievementCategoryProcessor(),

			SelectAchievementSetEvent.eventName(),
			new SelectAchievementSetProcessor(),

			ShowAchievementDetailsEvent.eventName(),
			new ShowAchievementDetailsProcessor(),

			VideoReplayDeletionRequestEvent.eventName(),
			new VideoReplayDeletionRequestProcessor(this.ow, achievementUpdateHelper, this.achievementsStorage),

			AchievementRecordedEvent.eventName(),
			new AchievementRecordedProcessor(
				this.achievementsStorage,
				achievementStateHelper,
				this.achievementsLoader,
				this.events,
			),

			AchievementCompletedEvent.eventName(),
			new AchievementCompletedProcessor(
				this.achievementHistoryStorage,
				this.achievementsLoader,
				achievementUpdateHelper,
			),

			FilterShownAchievementsEvent.eventName(),
			new FilterShownAchievementsProcessor(),

			GlobalStatsUpdatedEvent.eventName(),
			new GlobalStatsUpdatedProcessor(this.events),

			// Social
			StartSocialSharingEvent.eventName(),
			new StartSocialSharingProcessor(),

			TriggerSocialNetworkLoginToggleEvent.eventName(),
			new TriggerSocialNetworkLoginToggleProcessor(),

			UpdateTwitterSocialInfoEvent.eventName(),
			new UpdateTwitterSocialInfoProcessor(this.ow),

			ShareVideoOnSocialNetworkEvent.eventName(),
			new ShareVideoOnSocialNetworkProcessor(this.ow),

			CloseSocialShareModalEvent.eventName(),
			new CloseSocialShareModalProcessor(),

			// Ftue
			NextFtueEvent.eventName(),
			new NextFtueProcessor(this.prefs),

			PreviousFtueEvent.eventName(),
			new PreviousFtueProcessor(),

			SkipFtueEvent.eventName(),
			new SkipFtueProcessor(this.prefs),

			// Stats
			GameStatsInitEvent.eventName(),
			new GameStatsInitProcessor(this.replaysStateBuilder, this.decktrackerStateLoader),

			RecomputeGameStatsEvent.eventName(),
			new RecomputeGameStatsProcessor(this.decktrackerStateLoader),

			// Global stats
			GlobalStatsInitEvent.eventName(),
			new GlobalStatsInitProcessor(),

			// Replays
			ShowReplayEvent.eventName(),
			new ShowReplayProcessor(),

			ReplaysFilterEvent.eventName(),
			new ReplaysFilterProcessor(this.replaysStateBuilder),

			RecomputeReplaysEvent.eventName(),
			new RecomputeReplaysProcessor(this.replaysStateBuilder),

			// Decktracker
			SelectDecksViewEvent.eventName(),
			new SelectDeckViewProcessor(),

			ChangeDeckModeFilterEvent.eventName(),
			new ChangeDeckModeFilterProcessor(this.decksStateBuilder),
		);
	}

	private populateStore() {
		console.log('sending populate store event');
		// Launch events to start gathering data for the store
		this.stateUpdater.next(new PopulateStoreEvent());
		this.stateUpdater.next(new TriggerPopulateStoreEvent());
	}

	private listenForSocialAccountLoginUpdates() {
		this.ow.addTwitterLoginStateChangedListener(() => {
			this.stateUpdater.next(new UpdateTwitterSocialInfoEvent());
		});
	}
}
