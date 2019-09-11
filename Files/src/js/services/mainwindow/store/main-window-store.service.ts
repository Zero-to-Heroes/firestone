import { EventEmitter, Injectable } from '@angular/core';
import { Map } from 'immutable';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../models/mainwindow/navigation';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../achievement/achievements-storage.service';
import { AchievementsLoaderService } from '../../achievement/data/achievements-loader.service';
import { AllCardsService } from '../../all-cards.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { IndexedDbService } from '../../collection/indexed-db.service';
import { PackHistoryService } from '../../collection/pack-history.service';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { SimpleIOService } from '../../plugins/simple-io.service';
import { ProcessingQueue } from '../../processing-queue.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../stats/game/game-stats-updater.service';
import { AchievementCompletedEvent } from './events/achievements/achievement-completed-event';
import { AchievementHistoryCreatedEvent } from './events/achievements/achievement-history-created-event';
import { AchievementRecordedEvent } from './events/achievements/achievement-recorded-event';
import { ChangeAchievementsShortDisplayEvent } from './events/achievements/change-achievements-short-display-event';
import { ChangeVisibleAchievementEvent } from './events/achievements/change-visible-achievement-event';
import { SelectAchievementCategoryEvent } from './events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from './events/achievements/select-achievement-set-event';
import { ShowAchievementDetailsEvent } from './events/achievements/show-achievement-details-event';
import { VideoReplayDeletionRequestEvent } from './events/achievements/video-replay-deletion-request-event';
import { ChangeVisibleApplicationEvent } from './events/change-visible-application-event';
import { CloseMainWindowEvent } from './events/close-main-window-event';
import { LoadMoreCardHistoryEvent } from './events/collection/load-more-card-history-event';
import { NewCardEvent } from './events/collection/new-card-event';
import { NewPackEvent } from './events/collection/new-pack-event';
import { SearchCardsEvent } from './events/collection/search-cards-event';
import { SelectCollectionFormatEvent } from './events/collection/select-collection-format-event';
import { SelectCollectionSetEvent } from './events/collection/select-collection-set-event';
import { ShowCardDetailsEvent } from './events/collection/show-card-details-event';
import { ToggleShowOnlyNewCardsInHistoryEvent } from './events/collection/toggle-show-only-new-cards-in-history-event';
import { UpdateCardSearchResultsEvent } from './events/collection/update-card-search-results-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { NavigationBackEvent } from './events/navigation/navigation-back-event';
import { NavigationNextEvent } from './events/navigation/navigation-next-event';
import { PopulateStoreEvent } from './events/populate-store-event';
import { ShowMainWindowEvent } from './events/show-main-window-event';
import { CloseSocialShareModalEvent } from './events/social/close-social-share-modal-event';
import { ShareVideoOnSocialNetworkEvent } from './events/social/share-video-on-social-network-event';
import { StartSocialSharingEvent } from './events/social/start-social-sharing-event';
import { TriggerSocialNetworkLoginToggleEvent } from './events/social/trigger-social-network-login-toggle-event';
import { UpdateTwitterSocialInfoEvent } from './events/social/update-twitter-social-info-event';
import { RecomputeGameStatsEvent } from './events/stats/recompute-game-stats-event';
import { AchievementStateHelper } from './helper/achievement-state-helper';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';
import { AchievementCompletedProcessor } from './processors/achievements/achievement-completed-processor';
import { AchievementHistoryCreatedProcessor } from './processors/achievements/achievement-history-created-processor';
import { AchievementRecordedProcessor } from './processors/achievements/achievement-recorded-processor';
import { ChangeAchievementsShortDisplayProcessor } from './processors/achievements/change-achievements-short-display-processor';
import { ChangeVisibleAchievementProcessor } from './processors/achievements/change-visible-achievement-processor';
import { SelectAchievementCategoryProcessor } from './processors/achievements/select-achievement-category-processor';
import { SelectAchievementSetProcessor } from './processors/achievements/select-achievement-set-processor';
import { ShowAchievementDetailsProcessor } from './processors/achievements/show-achievement-details-processor';
import { VideoReplayDeletionRequestProcessor } from './processors/achievements/video-replay-deletion-request-processor';
import { ChangeVisibleApplicationProcessor } from './processors/change-visible-application-processor';
import { CloseMainWindowProcessor } from './processors/close-main-window-processor';
import { LoadMoreCardHistoryProcessor } from './processors/collection/load-more-card-history-processor';
import { NewCardProcessor } from './processors/collection/new-card-processor';
import { NewPackProcessor } from './processors/collection/new-pack-processor';
import { SearchCardProcessor } from './processors/collection/search-card-processor';
import { SelectCollectionFormatProcessor } from './processors/collection/select-collection-format-processor';
import { SelectCollectionSetProcessor } from './processors/collection/select-collection-set-processor';
import { ShowCardDetailsProcessor } from './processors/collection/show-card-details-processor';
import { ToggleShowOnlyNewCardsInHistoryProcessor } from './processors/collection/toggle-show-only-new-cards-in-history-processor';
import { UpdateCardSearchResultsProcessor } from './processors/collection/update-card-search-results-processor';
import { NavigationBackProcessor } from './processors/navigation/navigation-back-processor';
import { NavigationNextProcessor } from './processors/navigation/navigation-next-processor';
import { PopulateStoreProcessor } from './processors/populate-store-processor';
import { Processor } from './processors/processor';
import { ShowMainWindowProcessor } from './processors/show-main-window-processor';
import { CloseSocialShareModalProcessor } from './processors/social/close-social-share-modal-processor';
import { ShareVideoOnSocialNetworkProcessor } from './processors/social/share-video-on-social-network-processor';
import { StartSocialSharingProcessor } from './processors/social/start-social-sharing-processor';
import { TriggerSocialNetworkLoginToggleProcessor } from './processors/social/trigger-social-network-login-toggle-processor';
import { UpdateTwitterSocialInfoProcessor } from './processors/social/update-twitter-social-info-processor';
import { RecomputeGameStatsProcessor } from './processors/stats/recompute-game-stats-processor';
import { StateHistory } from './state-history';

const MAX_HISTORY_SIZE = 30;

@Injectable()
export class MainWindowStoreService {
	public stateUpdater = new EventEmitter<MainWindowStoreEvent>();

	private state: MainWindowState = new MainWindowState();
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
		private achievementsRepository: AchievementsRepository,
		private collectionManager: CollectionManager,
		private cardHistoryStorage: CardHistoryStorageService,
		private achievementsStorage: AchievementsStorageService,
		private achievementHistoryStorage: AchievementHistoryStorageService,
		private achievementsLoader: AchievementsLoaderService,
		private io: SimpleIOService,
		private collectionDb: IndexedDbService,
		private gameStatsUpdater: GameStatsUpdaterService,
		private gameStatsLoader: GameStatsLoaderService,
		private ow: OverwolfService,
		private memoryReading: MemoryInspectionService,
		private events: Events,
		private pityTimer: PackHistoryService,
	) {
		window['mainWindowStore'] = this.stateEmitter;
		window['mainWindowStoreUpdater'] = this.stateUpdater;
		this.gameStatsUpdater.stateUpdater = this.stateUpdater;

		this.processors = this.buildProcessors();

		this.stateUpdater.subscribe((event: MainWindowStoreEvent) => {
			this.processingQueue.enqueue(event);
		});

		this.ow.addGameInfoUpdatedListener((res: any) => {
			if (this.ow.gameLaunched(res)) {
				console.log('game launched, populating store', res);
				this.populateStore();
			}
		});
		this.populateStore();

		this.listenForSocialAccountLoginUpdates();
	}

	private async processQueue(eventQueue: readonly MainWindowStoreEvent[]): Promise<readonly MainWindowStoreEvent[]> {
		const event = eventQueue[0];
		console.log('[store] processing event', event.eventName());
		const processor: Processor = this.processors.get(event.eventName());
		const newState = await processor.process(event, this.state, this.stateHistory);
		if (newState) {
			this.addStateToHistory(newState, event.isNavigationEvent(), event.eventName());
			this.state = newState;
			// We don't want to store the status of the navigation arrows, as when going back
			// or forward with the history arrows, the state of these arrows will change
			// vs what they originally were when the state was stored
			const stateWithNavigation = this.updateNavigationArrows(newState);
			this.stateEmitter.next(stateWithNavigation);
		} else {
			console.log('[store] no new state to emit');
		}
		return eventQueue.slice(1);
	}

	private addStateToHistory(newState: MainWindowState, navigation: boolean, event: string): void {
		const newIndex = this.stateHistory.map(state => state.state).indexOf(newState);
		// console.log('newIndex', newIndex, this.stateHistory);
		// We just did a "next" or "previous", so we don't modify the history
		if (newIndex !== -1) {
			// console.log('[store] moving through history, so not modifying history', newIndex);
			return;
		} else {
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
		const backArrowEnabled = NavigationBackProcessor.getTargetIndex(state, this.stateHistory) !== -1;
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
		const achievementUpdateHelper = new AchievementUpdateHelper(this.achievementsRepository, achievementStateHelper);
		return Map.of(
			PopulateStoreEvent.eventName(),
			new PopulateStoreProcessor(
				this.achievementHistoryStorage,
				this.achievementsRepository,
				this.cardHistoryStorage,
				this.collectionManager,
				this.pityTimer,
				this.achievementsLoader,
				this.gameStatsLoader,
				this.ow,
				this.cards,
			),

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

			SearchCardsEvent.eventName(),
			new SearchCardProcessor(this.collectionManager, this.cards),

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
			new UpdateCardSearchResultsProcessor(this.collectionManager, this.cards),

			NewPackEvent.eventName(),
			new NewPackProcessor(this.collectionDb, this.cards),

			NewCardEvent.eventName(),
			new NewCardProcessor(this.collectionDb, this.memoryReading, this.cardHistoryStorage, this.pityTimer, this.cards),

			AchievementHistoryCreatedEvent.eventName(),
			new AchievementHistoryCreatedProcessor(this.achievementHistoryStorage, this.achievementsLoader),

			ChangeAchievementsShortDisplayEvent.eventName(),
			new ChangeAchievementsShortDisplayProcessor(),

			ChangeVisibleAchievementEvent.eventName(),
			new ChangeVisibleAchievementProcessor(),

			SelectAchievementCategoryEvent.eventName(),
			new SelectAchievementCategoryProcessor(),

			SelectAchievementSetEvent.eventName(),
			new SelectAchievementSetProcessor(),

			ShowAchievementDetailsEvent.eventName(),
			new ShowAchievementDetailsProcessor(),

			VideoReplayDeletionRequestEvent.eventName(),
			new VideoReplayDeletionRequestProcessor(this.io, achievementUpdateHelper, this.achievementsStorage),

			AchievementRecordedEvent.eventName(),
			new AchievementRecordedProcessor(this.achievementsStorage, achievementStateHelper, this.events),

			AchievementCompletedEvent.eventName(),
			new AchievementCompletedProcessor(
				this.achievementsStorage,
				this.achievementHistoryStorage,
				this.achievementsLoader,
				this.events,
				achievementUpdateHelper,
			),

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

			RecomputeGameStatsEvent.eventName(),
			new RecomputeGameStatsProcessor(this.gameStatsUpdater),
		);
	}

	private populateStore() {
		console.log('sending populate store event');
		this.stateUpdater.next(new PopulateStoreEvent());
	}

	private listenForSocialAccountLoginUpdates() {
		this.ow.addTwitterLoginStateChangedListener(() => {
			this.stateUpdater.next(new UpdateTwitterSocialInfoEvent());
		});
	}
}
