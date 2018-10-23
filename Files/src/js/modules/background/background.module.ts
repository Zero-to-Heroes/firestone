import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { AppComponent }  from '../../components/app.component';

import { DebugService } from '../../services/debug.service';
import { Events }  from '../../services/events.service';
import { GameEvents }  from '../../services/game-events.service';
import { HsPublicEventsListener }  from '../../services/hs-public-events-listener.service';
import { LogListenerService }  from '../../services/log-listener.service';
import { LogRegisterService }  from '../../services/log-register.service';
import { LogStatusService }  from '../../services/log-status.service';
import { OwNotificationsService }  from '../../services/notifications.service';

import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';

import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsRefereee } from '../../services/achievement/achievements-referee.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { IndexedDbService as AchievementsDb }  from '../../services/achievement/indexed-db.service';

import { AllCardsService }  from '../../services/all-cards.service';
import { CardHistoryStorageService }  from '../../services/collection/card-history-storage.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';
import { LogParserService }  from '../../services/collection/log-parser.service';
import { PackMonitor }  from '../../services/collection/pack-monitor.service';
import { PackHistoryService } from '../../services/collection/pack-history.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { AchievementStatsService } from '../../services/achievement/achievement-stats.service';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementNameService } from 'src/js/services/achievement/achievement-name.service';
import { DevService } from 'src/js/services/dev.service';


@NgModule({
	bootstrap: [AppComponent],
	imports: [
		BrowserModule,
		HttpModule,
		BrowserAnimationsModule
	],
	declarations: [
		AppComponent
	],
	providers: [
		AllCardsService,
		CardHistoryStorageService,
		CollectionManager,
		Events,
		DebugService,
		DevService,
		HsPublicEventsListener,
		GameEvents,
		IndexedDbService,
		LogListenerService,
		LogParserService,
		LogRegisterService,
		LogStatusService,
		OwNotificationsService,
		PackMonitor,
		PackHistoryService,
		PackStatsService,
		SimpleIOService,
		MemoryInspectionService,
		AchievementHistoryStorageService,
		AchievementsMonitor,
		AchievementNameService,
		AchievementsRefereee,
		AchievementsRepository,
		AchievementStatsService,
		AchievementsStorageService,
		AchievementsDb,
		PackHistoryService,
	]
})
export class AppModule { }
