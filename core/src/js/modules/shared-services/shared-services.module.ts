import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { MindVisionStateMachineService } from '@services/plugins/mind-vision/mind-vision-state-machine.service';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService as AchievementsDb } from '../../services/achievement/achievements-storage.service';
import { ChallengeBuilderService } from '../../services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../services/achievement/data/achievements-loader.service';
import { ApiRunner } from '../../services/api-runner';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { CollectionStorageService } from '../../services/collection/collection-storage.service';
import { SetsService } from '../../services/collection/sets-service.service';
import { DebugService } from '../../services/debug.service';
import { CardsHighlightService } from '../../services/decktracker/card-highlight/cards-highlight.service';
import { DeckHandlerService } from '../../services/decktracker/deck-handler.service';
import { Events } from '../../services/events.service';
import { GenericStorageService } from '../../services/generic-storage.service';
import { HotkeyService } from '../../services/hotkey.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { OverwolfService } from '../../services/overwolf.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { MindVisionFacadeService } from '../../services/plugins/mind-vision/mind-vision-facade.service';
import { OwUtilsService } from '../../services/plugins/ow-utils.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { PreferencesService } from '../../services/preferences.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';

@NgModule({
	imports: [BrowserModule],
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
				GenericStorageService,
				LogsUploaderService,
				MemoryInspectionService,
				OverwolfService,
				OwNotificationsService,
				PreferencesService,
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
				MindVisionFacadeService,
				MindVisionStateMachineService,
				OwUtilsService,
				HotkeyService,
				ApiRunner,
				CardsHighlightService,
				CardsHighlightFacadeService,
			],
		};
	}
}
