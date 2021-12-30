import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SharedDataAccessApiRunnerModule } from '@firestone/shared/data-access/api-runner';
import { SharedDataAccessStorageModule } from '@firestone/shared/data-access/storage';
import { SharedFeatureOverwolfModule } from '@firestone/shared/feature/overwolf';
import { SharedFeaturePreferencesModule } from '@firestone/shared/feature/preferences';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService as AchievementsDb } from '../../services/achievement/achievements-storage.service';
import { ChallengeBuilderService } from '../../services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../services/achievement/data/achievements-loader.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { CollectionStorageService } from '../../services/collection/collection-storage.service';
import { SetsService } from '../../services/collection/sets-service.service';
import { DebugService } from '../../services/debug.service';
import { CardsHighlightService } from '../../services/decktracker/card-highlight/cards-highlight.service';
import { DeckHandlerService } from '../../services/decktracker/deck-handler.service';
import { Events } from '../../services/events.service';
import { HotkeyService } from '../../services/hotkey.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { MindVisionService } from '../../services/plugins/mind-vision/mind-vision.service';
import { OwUtilsService } from '../../services/plugins/ow-utils.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';

@NgModule({
	imports: [
		BrowserModule,
		SharedDataAccessApiRunnerModule,
		SharedDataAccessStorageModule,
		SharedFeatureOverwolfModule,
		SharedFeaturePreferencesModule,
	],
	declarations: [],
	entryComponents: [],
	exports: [],
})
export class SharedServicesModule {
	static forRoot(): ModuleWithProviders<any> {
		return {
			ngModule: SharedServicesModule,
			providers: [
				SetsService,
				DebugService,
				Events,
				LogsUploaderService,
				MemoryInspectionService,
				OwNotificationsService,
				S3FileUploadService,
				SimpleIOService,

				AchievementHistoryStorageService,
				AchievementsRepository,
				ChallengeBuilderService,
				AchievementsLoaderService,
				AchievementsDb,

				DeckHandlerService,
				CardHistoryStorageService,
				CollectionManager,
				CollectionStorageService,
				MindVisionService,
				OwUtilsService,
				HotkeyService,
				CardsHighlightService,
			],
		};
	}
}
