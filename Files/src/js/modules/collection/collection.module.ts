import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { SelectModule } from 'ng-select';

import { SharedModule } from '../shared/shared.module';

import { MainWindowComponent }  from '../../components/main-window.component';
import { MenuSelectionComponent }  from '../../components/menu-selection.component';
import { RealTimeNotificationsComponent }  from '../../components/real-time-notifications.component';
import { TooltipsComponent, Tooltip }  from '../../components/tooltips.component';

import { CollectionComponent }  from '../../components/collection.component';
import { CollectionEmptyStateComponent }  from '../../components/collection/collection-empty-state.component';
import { CollectionMenuComponent }  from '../../components/collection/collection-menu.component';
import { CardsComponent }  from '../../components/collection/cards.component';
import { CardHistoryComponent }  from '../../components/collection/card-history.component';
import { CardHistoryItemComponent }  from '../../components/collection/card-history-item.component';
import { FullCardComponent }  from '../../components/collection/full-card.component';
import { SetComponent }  from '../../components/collection/set.component';
import { SetsContainer }  from '../../components/collection/sets-container.component';
import { RarityComponent }  from '../../components/collection/rarity.component';
import { CardComponent }  from '../../components/collection/card.component';
import { CardSearchComponent }  from '../../components/collection/card-search.component';
import { CardSearchAutocompleteItemComponent } from '../../components/collection/card-search-autocomplete-item.component';
import { SetsComponent }  from '../../components/collection/sets.component';

import { AchievementsComponent }  from '../../components/achievements/achievements.component';
import { AchievementViewComponent }  from '../../components/achievements/achievement-view.component';
import { AchievementsCategoriesComponent }  from '../../components/achievements/achievements-categories.component';
import { AchievementsListComponent }  from '../../components/achievements/achievements-list.component';
import { AchievementsMenuComponent }  from '../../components/achievements/achievements-menu.component';
import { AchievementSetComponent }  from '../../components/achievements/achievement-set.component';

import { AllCardsService }  from '../../services/all-cards.service';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { OwNotificationsService }  from '../../services/notifications.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { RealTimeNotificationService }  from '../../services/real-time-notifications.service';

import { CardHistoryStorageService }  from '../../services/collection/card-history-storage.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';

import { IndexedDbService as AchievementsDbService }  from '../../services/achievement/indexed-db.service';
import { AchievementsRepository }  from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService }  from '../../services/achievement/achievements-storage.service';
import { PackHistoryService } from '../../services/collection/pack-history.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { PreferencesService } from '../../services/preferences.service';
import { FtueElement, FtueComponent } from '../../components/ftue.component';
import { AchievementHistoryComponent } from '../../components/achievements/achievement-history.component';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementHistoryItemComponent } from '../../components/achievements/achievement-history-item.component';
import { AchievementNameService } from '../../services/achievement/achievement-name.service';
import { AchievementProgressBarComponent } from 'src/js/components/achievements/achievement-progress-bar.component';
import { AchievementImageComponent } from 'src/js/components/achievements/achievement-image.component';
import { AchievementRecordingsComponent } from 'src/js/components/achievements/achievement-recordings.component';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
		FormsModule,
		ReactiveFormsModule,
        SelectModule,
		SharedModule,
	],
	declarations: [
		CardComponent,
		CardHistoryComponent,
		CardHistoryItemComponent,
		CardsComponent,
		CardSearchComponent,
		CardSearchAutocompleteItemComponent,
		CollectionComponent,
		CollectionEmptyStateComponent,
		CollectionMenuComponent,
		FullCardComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
		RealTimeNotificationsComponent,
		SetComponent,
		SetsComponent,
		SetsContainer,

		AchievementsComponent,
		AchievementsCategoriesComponent,
		AchievementHistoryComponent,
		AchievementHistoryItemComponent,
		AchievementImageComponent,
		AchievementsListComponent,
		AchievementsMenuComponent,
		AchievementRecordingsComponent,
		AchievementSetComponent,
		AchievementProgressBarComponent,
		AchievementViewComponent,

		FtueElement,
		FtueComponent,
		Tooltip,
		TooltipsComponent,
	],
	bootstrap: [
		MainWindowComponent,
	],
	entryComponents: [Tooltip, FtueElement],
	providers: [
		AllCardsService,
		CardHistoryStorageService,
		CollectionManager,
		DebugService,
		Events,
		GenericIndexedDbService,
		IndexedDbService,
		OwNotificationsService,
		MemoryInspectionService,
		PreferencesService,
		RealTimeNotificationService,

		AchievementsDbService,
		AchievementHistoryStorageService,
		AchievementNameService,
		AchievementsRepository,
		AchievementsStorageService,
		PackHistoryService,
	],
})


export class CollectionModule { }
