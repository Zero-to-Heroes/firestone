import { Injectable } from '@angular/core';
import { AllCardsService } from '../../all-cards.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { PackHistoryService } from '../../collection/pack-history.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { SimpleIOService } from '../../plugins/simple-io.service';
import { AchievementsStorageService } from '../../achievement/achievements-storage.service';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';

@Injectable()
// Used so that events have easy access to injected services
export class CollaboratorsService {
	constructor(
		public cards: AllCardsService,
		public achievementsRepository: AchievementsRepository,
		public collectionManager: CollectionManager,
		public cardHistoryStorage: CardHistoryStorageService,
		public achievementsStorage: AchievementsStorageService,
		public achievementHistoryStorage: AchievementHistoryStorageService,
		public io: SimpleIOService,
		public pityTimer: PackHistoryService,
	) {}
}
