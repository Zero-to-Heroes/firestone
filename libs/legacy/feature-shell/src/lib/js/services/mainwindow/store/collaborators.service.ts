import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { CollectionManager } from '../../collection/collection-manager.service';

@Injectable()
// Used so that events have easy access to injected services
export class CollaboratorsService {
	constructor(
		public cards: CardsFacadeService,
		public achievementsRepository: AchievementsRepository,
		public collectionManager: CollectionManager,
		public achievementHistoryStorage: AchievementHistoryStorageService,
	) {}
}
