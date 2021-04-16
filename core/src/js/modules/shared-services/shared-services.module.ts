import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { ChallengeBuilderService } from '../../services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../services/achievement/data/achievements-loader.service';
import { AchievementsLocalDbService as AchievementsDb } from '../../services/achievement/indexed-db.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { IndexedDbService } from '../../services/collection/indexed-db.service';
import { SetsService } from '../../services/collection/sets-service.service';
import { DebugService } from '../../services/debug.service';
import { DeckHandlerService } from '../../services/decktracker/deck-handler.service';
import { Events } from '../../services/events.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { HotkeyService } from '../../services/hotkey.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { OverwolfService } from '../../services/overwolf.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { MindVisionService } from '../../services/plugins/mind-vision/mind-vision.service';
import { OwUtilsService } from '../../services/plugins/ow-utils.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { PreferencesService } from '../../services/preferences.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';

@NgModule({
	imports: [BrowserModule, LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG })],
	declarations: [],
	entryComponents: [],
	exports: [],
})
export class SharedServicesModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: SharedServicesModule,
			providers: [
				SetsService,
				DebugService,
				Events,
				GenericIndexedDbService,
				LogsUploaderService,
				MemoryInspectionService,
				OverwolfService,
				OwNotificationsService,
				PreferencesService,
				S3FileUploadService,
				SimpleIOService,
				AllCardsService,

				AchievementHistoryStorageService,
				AchievementsRepository,
				ChallengeBuilderService,
				AchievementsLoaderService,
				AchievementsDb,

				DeckHandlerService,
				CardHistoryStorageService,
				CollectionManager,
				IndexedDbService,
				MindVisionService,
				OwUtilsService,
				HotkeyService,
			],
		};
	}
}
