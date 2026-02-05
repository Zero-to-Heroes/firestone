import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { AchievementHistoryStorageService } from './services/achievement-history-storage.service';
import { AchievementHistoryService } from './services/achievements-history.service';
import { AchievementsMemoryMonitor } from './services/achievements-memory-monitor.service';
import { AchievementsNavigationService } from './services/achievements-navigation.service';
import { AchievementsNotificationService } from './services/achievements-notification.service';
import { AchievementsStateManagerService } from './services/achievements-state-manager.service';
import { AchievementsStorageService } from './services/achievements-storage.service';
import { FirestoneRemoteAchievementsLoaderService } from './services/firestone-remote-achievements-loader.service';
import { RawAchievementsLoaderService } from './services/raw-achievements-loader.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule],
	providers: [
		AchievementsNavigationService,
		AchievementsStateManagerService,
		FirestoneRemoteAchievementsLoaderService,
		RawAchievementsLoaderService,
		AchievementsStorageService,
		AchievementsMemoryMonitor,
		AchievementHistoryStorageService,
		AchievementHistoryService,
		AchievementsNotificationService,
	],
})
export class AchievementsCommonModule {}
