import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { MercenariesAddMercToBackupTeamEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-add-merc-to-backup-team-event';
import { MercenariesRemoveMercToBackupTeamEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-remove-merc-to-backup-team-event';
import { MercenariesMemoryCacheService } from '../../../services/mercenaries/mercenaries-memory-cache.service';
import { MercenariesReferenceDataService } from '../../../services/mercenaries/mercenaries-reference-data.service';
import { getHeroRole, getShortMercHeroName } from '../../../services/mercenaries/mercenaries-utils';
import { buildHeroFrame } from '../../mercenaries/desktop/mercenaries-personal-hero-stat.component';

@Component({
	selector: 'settings-mercenaries-quests',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/mercenaries/settings-mercenaries-quests.component.scss`,
	],
	template: `
		<div class="mercenaries-quests">
			<div class="title" [owTranslate]="'settings.mercenaries.quests.title'"></div>
			<p class="explanation" [owTranslate]="'settings.mercenaries.quests.explanation'"></p>
			<autocomplete-search-with-list
				class="mercs-search"
				(itemClicked)="addMerc($event)"
				[valueMatcher]="valueMatcher"
				[placeholder]="'settings.mercenaries.quests.search-box-placeholder' | owTranslate"
				[dataSet]="mercs$ | async"
			></autocomplete-search-with-list>
			<div class="team">
				<ng-container *ngIf="backupTeam$ | async as backupTeam; else emptyState">
					<div class="merc" *ngFor="let merc of backupTeam">
						<div class="portrait" [cardTooltip]="merc.cardId">
							<img class="icon" [src]="merc.portraitUrl" />
							<img class="frame" [src]="merc.frameUrl" />
						</div>
						<div class="name">{{ merc.name }}</div>
						<button
							class="remove-button"
							inlineSVG="assets/svg/close.svg"
							(click)="removeMerc(merc)"
						></button>
					</div>
				</ng-container>
				<ng-template #emptyState [owTranslate]="'settings.mercenaries.quests.empty-team'"></ng-template>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesQuestsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	mercs$: Observable<readonly Merc[]>;
	backupTeam$: Observable<readonly BackupTeamMerc[]>;

	valueMatcher: (item: Merc) => string = (merc) => merc.name;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly mercenariesCollection: MercenariesMemoryCacheService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesCollection, this.mercenariesReferenceData, this.prefs);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.backupTeam$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesBackupTeam)),
			this.mercenariesCollection.memoryCollectionInfo$$,
			this.mercenariesReferenceData.referenceData$$,
		]).pipe(
			filter(
				([backupTeam, collection, refData]) =>
					!!refData?.mercenaries?.length && !!collection?.Mercenaries?.length,
			),
			this.mapData(([backupTeam, collection, refData]) => {
				const refBackup = backupTeam.map((mercId) => refData.mercenaries.find((m) => m.id === mercId));
				const result = refBackup
					.map((refMerc) => {
						const memMerc = collection.Mercenaries.find((m) => m.Id === refMerc.id);
						if (!memMerc) {
							return null;
						}
						const mercenaryCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
						const role = getHeroRole(mercenaryCard.mercenaryRole);
						const finalMerc: BackupTeamMerc = {
							id: refMerc.id,
							cardId: mercenaryCard.id,
							name: getShortMercHeroName(mercenaryCard.id, this.allCards),
							portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${mercenaryCard.id}.jpg`,
							frameUrl: buildHeroFrame(role, memMerc.Premium),
						};
						return finalMerc;
					})
					.filter((m) => !!m);
				return !!result?.length ? result : null;
			}),
		);
		this.mercs$ = combineLatest([
			this.mercenariesCollection.memoryCollectionInfo$$,
			this.mercenariesReferenceData.referenceData$$,
			this.backupTeam$,
		]).pipe(
			filter(
				([mercCollection, refData, backupTeam]) =>
					!!refData?.mercenaries?.length && !!mercCollection?.Mercenaries?.length,
			),
			this.mapData(([mercCollection, refData, backupTeam]) => {
				const backupTeamIds = backupTeam?.map((m) => m.id) ?? [];
				const result = mercCollection?.Mercenaries?.filter((m) => m.Owned)
					.filter((m) => !backupTeamIds.includes(m.Id))
					.map((merc) => {
						const refMerc = refData.mercenaries.find((m) => m.id === merc.Id);
						return {
							id: merc.Id,
							name: refMerc?.name ?? `${merc.Id}`,
							level: merc.Level,
						};
					});
				return !!result?.length ? result : null;
			}),
		);

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	addMerc(merc: Merc) {
		this.stateUpdater.next(new MercenariesAddMercToBackupTeamEvent(merc.id));
	}

	removeMerc(merc: BackupTeamMerc) {
		this.stateUpdater.next(new MercenariesRemoveMercToBackupTeamEvent(merc.id));
	}
}

interface Merc {
	id: number;
	name: string;
	level: number;
}

interface BackupTeamMerc {
	id: number;
	cardId: string;
	name: string;
	portraitUrl: string;
	frameUrl: string;
}
