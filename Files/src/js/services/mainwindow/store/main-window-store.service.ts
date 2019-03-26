import { Injectable, EventEmitter } from '@angular/core';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BehaviorSubject } from 'rxjs';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { PopulateStoreEvent } from './events/populate-store-event';
import { SearchCardsEvent } from './events/collection/search-cards-event';
import { Processor } from './processors/processor';
import { SearchCardProcessor } from './processors/collection/search-card-processor';
import { Map } from 'immutable';
import { LoadMoreCardHistoryEvent } from './events/collection/load-more-card-history-event';
import { LoadMoreCardHistoryProcessor } from './processors/collection/load-more-card-history-processor';
import { AllCardsService } from '../../all-cards.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { AchievementsStorageService } from '../../achievement/achievements-storage.service';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { SimpleIOService } from '../../plugins/simple-io.service';
import { PackHistoryService } from '../../collection/pack-history.service';
import { SelectCollectionFormatEvent } from './events/collection/select-collection-format-event';
import { SelectCollectionFormatProcessor } from './processors/collection/select-collection-format-processor';
import { SelectCollectionSetEvent } from './events/collection/select-collection-set-event';
import { SelectCollectionSetProcessor } from './processors/collection/select-collection-set-processor';
import { ShowCardDetailsEvent } from './events/collection/show-card-details-event';
import { ShowCardDetailsProcessor } from './processors/collection/show-card-details-processor';
import { ToggleShowOnlyNewCardsInHistoryEvent } from './events/collection/toggle-show-only-new-cards-in-history-event';
import { ToggleShowOnlyNewCardsInHistoryProcessor } from './processors/collection/toggle-show-only-new-cards-in-history-processor';
import { UpdateCardSearchResultsEvent } from './events/collection/update-card-search-results-event';
import { UpdateCardSearchResultsProcessor } from './processors/collection/update-card-search-results-processor';
import { AchievementHistoryCreatedEvent } from './events/achievements/achievement-history-created-event';
import { AchievementHistoryCreatedProcessor } from './processors/achievements/achievement-history-created-processor';

import { ChangeAchievementsShortDisplayEvent } from './events/achievements/change-achievements-short-display-event';
import { ChangeAchievementsShortDisplayProcessor } from './processors/achievements/change-achievements-short-display-processor';
import { ChangeVisibleAchievementEvent } from './events/achievements/change-visible-achievement-event';
import { ChangeVisibleAchievementProcessor } from './processors/achievements/change-visible-achievement-processor';
import { SelectAchievementCategoryEvent } from './events/achievements/select-achievement-category-event';
import { SelectAchievementCategoryProcessor } from './processors/achievements/select-achievement-category-processor';
import { SelectAchievementSetEvent } from './events/achievements/select-achievement-set-event';
import { SelectAchievementSetProcessor } from './processors/achievements/select-achievement-set-processor';
import { ShowAchievementDetailsEvent } from './events/achievements/show-achievement-details-event';
import { ShowAchievementDetailsProcessor } from './processors/achievements/show-achievement-details-processor';
import { VideoReplayDeletionRequestEvent } from './events/achievements/video-replay-deletion-request-event';
import { VideoReplayDeletionRequestProcessor } from './processors/achievements/video-replay-deletion-request-processor';
import { PopulateStoreProcessor } from './processors/populate-store-processor';
import { ChangeVisibleApplicationEvent } from './events/change-visible-application-event';
import { ChangeVisibleApplicationProcessor } from './processors/change-visible-application-processor';
import { NewPackEvent } from './events/collection/new-pack-event';
import { NewPackProcessor } from './processors/collection/new-pack-processor';
import { IndexedDbService } from '../../collection/indexed-db.service';
import { IndexedDbService as AchievementsDb } from '../../achievement/indexed-db.service';
import { NewCardEvent } from './events/collection/new-card-event';
import { NewCardProcessor } from './processors/collection/new-card-processor';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { AchievementRecordedProcessor } from './processors/achievements/achievement-recorded-processor';
import { Events } from '../../events.service';
import { AchievementRecordedEvent } from './events/achievements/achievement-recorded-event';
import { AchievementCompletedEvent } from './events/achievements/achievement-completed-event';
import { AchievementCompletedProcessor } from './processors/achievements/achievement-completed-processor';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';
import { CloseMainWindowEvent } from './events/close-main-window-event';
import { CloseMainWindowProcessor } from './processors/close-main-window-processor';
import { AchievementStateHelper } from './helper/achievement-state-helper';

declare var overwolf;
const HEARTHSTONE_GAME_ID = 9898;

@Injectable()
export class MainWindowStoreService {

	public stateUpdater = new EventEmitter<MainWindowStoreEvent>();
	private state: MainWindowState = new MainWindowState();
	private stateEmitter = new BehaviorSubject<MainWindowState>(this.state);
	private processors: Map<String, Processor>;

	private eventQueue: MainWindowStoreEvent[] = [];
	private isProcessing: boolean = false;

	constructor(
		private cards: AllCardsService,
			private achievementsRepository: AchievementsRepository,
			private collectionManager: CollectionManager,
			private cardHistoryStorage: CardHistoryStorageService,
			private achievementsStorage: AchievementsStorageService,
			private achievementHistoryStorage: AchievementHistoryStorageService,
			private io: SimpleIOService,
			private collectionDb: IndexedDbService,
			private achievementsDb: AchievementsDb,
			private memoryReading: MemoryInspectionService,
			private events: Events,
			private pityTimer: PackHistoryService) {
		window['mainWindowStore'] = this.stateEmitter;
		window['mainWindowStoreUpdater'] = this.stateUpdater;

		this.processors = this.buildProcessors();

		this.stateUpdater.subscribe((event: MainWindowStoreEvent) => {
			this.eventQueue.push(event);
			// So that we don't wait for the next tick in case the event can be processed right away
			this.processQueue();
		});

		setInterval(() => this.processQueue(), 50);

		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.gameLaunched(res)) {
				this.populateStore();
			}
		});

		this.populateStore();
	}

	// We want events to be processed sequentially
	private async processQueue() {
		if (this.isProcessing || this.eventQueue.length === 0) {
			return;
		}
		this.isProcessing = true;
		const event = this.eventQueue.shift();
		console.log('[store] processing event', event);
		const processor: Processor = this.processors.get(event.constructor.name);
		const newState = await processor.process(event, this.state);
		if (newState) {
			this.state = newState;
			this.stateEmitter.next(this.state);
			console.log('[store] emitted new state', this.state);
		}
		this.isProcessing = false;
		console.log('[store] processing over');
	}

	private buildProcessors(): Map<String, Processor> {
		const achievementStateHelper = new AchievementStateHelper();
		const achievementUpdateHelper = new AchievementUpdateHelper(this.achievementsRepository, achievementStateHelper);
		return Map.of(
			PopulateStoreEvent.name, new PopulateStoreProcessor(
				this.achievementHistoryStorage,
				this.achievementsRepository,
				this.cardHistoryStorage,
				this.collectionManager,
				this.pityTimer,
				this.cards),
			ChangeVisibleApplicationEvent.name, new ChangeVisibleApplicationProcessor(),
			CloseMainWindowEvent.name, new CloseMainWindowProcessor(),

			SearchCardsEvent.name, new SearchCardProcessor(this.collectionManager, this.cards),
			LoadMoreCardHistoryEvent.name, new LoadMoreCardHistoryProcessor(this.cardHistoryStorage),
			SelectCollectionFormatEvent.name, new SelectCollectionFormatProcessor(),
			SelectCollectionSetEvent.name, new SelectCollectionSetProcessor(),
			ShowCardDetailsEvent.name, new ShowCardDetailsProcessor(),
			ToggleShowOnlyNewCardsInHistoryEvent.name, new ToggleShowOnlyNewCardsInHistoryProcessor(),
			UpdateCardSearchResultsEvent.name, new UpdateCardSearchResultsProcessor(this.collectionManager, this.cards),
			NewPackEvent.name, new NewPackProcessor(this.collectionDb, this.cards),
			NewCardEvent.name, new NewCardProcessor(this.collectionDb, this.memoryReading, this.cardHistoryStorage, 
				this.pityTimer, this.cards),
			
			AchievementHistoryCreatedEvent.name, new AchievementHistoryCreatedProcessor(this.achievementHistoryStorage),
			ChangeAchievementsShortDisplayEvent.name, new ChangeAchievementsShortDisplayProcessor(),
			ChangeVisibleAchievementEvent.name, new ChangeVisibleAchievementProcessor(),
			SelectAchievementCategoryEvent.name, new SelectAchievementCategoryProcessor(),
			SelectAchievementSetEvent.name, new SelectAchievementSetProcessor(),
			ShowAchievementDetailsEvent.name, new ShowAchievementDetailsProcessor(),
			VideoReplayDeletionRequestEvent.name, new VideoReplayDeletionRequestProcessor(this.io, achievementUpdateHelper,
				this.achievementsStorage),
			AchievementRecordedEvent.name, new AchievementRecordedProcessor(this.achievementsStorage, 
				achievementStateHelper, this.events),
			AchievementCompletedEvent.name, new AchievementCompletedProcessor(this.achievementsStorage, 
				this.achievementHistoryStorage, this.achievementsRepository, this.events, achievementUpdateHelper),
		);
	}

	private populateStore() {
		this.stateUpdater.next(new PopulateStoreEvent());
	}

	gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult) {
			return false;
		}
		if (!gameInfoResult.gameInfo) {
			return false;
		}
		if (!gameInfoResult.gameInfo.isRunning) {
			return false;
		}
		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			return false;
		}
		return true;
	}

	gameRunning(gameInfo: any): boolean {
		if (!gameInfo) {
			return false;
		}
		if (!gameInfo.isRunning) {
			return false;
		}
		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			return false;
		}
		return true;
	}
}
