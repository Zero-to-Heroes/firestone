import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsLocalStorageService } from '../../achievement/achievements-local-storage.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { PackHistoryService } from '../../collection/pack-history.service';

@Injectable()
// Used so that events have easy access to injected services
export class CollaboratorsService {
	constructor(
		public cards: AllCardsService,
		public achievementsRepository: AchievementsRepository,
		public collectionManager: CollectionManager,
		public cardHistoryStorage: CardHistoryStorageService,
		public achievementsStorage: AchievementsLocalStorageService,
		public achievementHistoryStorage: AchievementHistoryStorageService,
		public pityTimer: PackHistoryService,
	) {}
}
