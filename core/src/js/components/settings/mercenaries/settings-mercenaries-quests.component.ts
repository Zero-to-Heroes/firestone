import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { MercenariesAddMercToBackupTeamEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-add-merc-to-backup-team-event';
import { MercenariesRemoveMercToBackupTeamEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-remove-merc-to-backup-team-event';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { buildHeroFrame } from '../../mercenaries/desktop/mercenaries-personal-hero-stat.component';

@Component({
	selector: 'settings-mercenaries-quests',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
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
						<div class="name" [helpTooltip]="merc.name">{{ merc.name }}</div>
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

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.backupTeam$ = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.mercenariesBackupTeam),
			this.store.listen$(
				([main, nav]) => main.mercenaries.collectionInfo,
				([main, nav]) => main.mercenaries.getReferenceData(),
			),
		).pipe(
			filter(
				([[backupTeam], [collection, refData]]) =>
					!!refData?.mercenaries?.length && !!collection?.Mercenaries?.length,
			),
			this.mapData(([[backupTeam], [collection, refData]]) => {
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
							name: refMerc.name,
							portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${mercenaryCard.id}.jpg`,
							frameUrl: buildHeroFrame(role, memMerc.Premium),
						};
						return finalMerc;
					})
					.filter((m) => !!m);
				return !!result?.length ? result : null;
			}),
		);
		this.mercs$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.mercenaries.collectionInfo,
				([main, nav]) => main.mercenaries.getReferenceData(),
			),
			this.backupTeam$,
		).pipe(
			filter(
				([[mercCollection, refData], backupTeam]) =>
					!!refData?.mercenaries?.length && !!mercCollection?.Mercenaries?.length,
			),
			this.mapData(([[mercCollection, refData], backupTeam]) => {
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
				console.debug('returning', result);
				return !!result?.length ? result : null;
			}),
		);
	}

	addMerc(merc: Merc) {
		console.debug('adding merc', merc);
		this.store.send(new MercenariesAddMercToBackupTeamEvent(merc.id));
	}

	removeMerc(merc: BackupTeamMerc) {
		this.store.send(new MercenariesRemoveMercToBackupTeamEvent(merc.id));
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
