import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaQuestStatTierItem, buildQuestStats } from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-meta-stats-quests',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-quests.component.scss`,
	],
	template: `
		<ng-container *ngIf="{ questStats: questStats$ | async } as value">
			<battlegrounds-meta-stats-quests-view
				[stats]="value.questStats"
				[collapsedQuests]="collapsedQuests$ | async"
				[groupedByDifficulty]="groupedByDifficulty$ | async"
				(statClick)="onStatClicked($event)"
				(collapseAll)="onCollapseAll(value.questStats)"
				(expandAll)="onExpandAll()"
				(groupDifficulty)="onGroupDifficulty()"
				(ungroupDifficulty)="onUngroupDifficulty()"
			></battlegrounds-meta-stats-quests-view>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	questStats$: Observable<readonly BgsMetaQuestStatTierItem[]>;
	collapsedQuests$: Observable<readonly string[]>;
	groupedByDifficulty$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.groupedByDifficulty$ = this.listenForBasicPref$((prefs) => prefs.bgsGroupQuestsByDifficulty);
		this.questStats$ = combineLatest([
			this.store.bgsQuests$(),
			this.listenForBasicPref$((prefs) => prefs.bgsActiveRankFilter),
			this.groupedByDifficulty$,
		]).pipe(
			this.mapData(([stats, mmrFilter, bgsGroupQuestsByDifficulty]) =>
				buildQuestStats(stats?.questStats ?? [], mmrFilter, bgsGroupQuestsByDifficulty, this.allCards),
			),
		);
		this.collapsedQuests$ = this.listenForBasicPref$((prefs) => prefs.bgsQuestsCollapsed);
	}

	async onStatClicked(stat: BgsMetaQuestStatTierItem) {
		const prefs = await this.prefs.getPreferences();
		const currentCollapsed: readonly string[] = prefs.bgsQuestsCollapsed;
		const newCollapsed = currentCollapsed.includes(stat.cardId)
			? currentCollapsed.filter((label) => label !== stat.cardId)
			: [...currentCollapsed, stat.cardId];
		const newPrefs = {
			...prefs,
			bgsQuestsCollapsed: newCollapsed,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	async onCollapseAll(stats: readonly BgsMetaQuestStatTierItem[]) {
		const prefs = await this.prefs.getPreferences();
		const newCollapsed = stats.map((s) => s.cardId);
		const newPrefs = {
			...prefs,
			bgsQuestsCollapsed: newCollapsed,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	async onExpandAll() {
		const prefs = await this.prefs.getPreferences();
		const newPrefs = {
			...prefs,
			bgsQuestsCollapsed: [],
		};
		await this.prefs.savePreferences(newPrefs);
	}

	async onGroupDifficulty() {
		const prefs = await this.prefs.getPreferences();
		const newPrefs = {
			...prefs,
			bgsGroupQuestsByDifficulty: true,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	async onUngroupDifficulty() {
		const prefs = await this.prefs.getPreferences();
		const newPrefs = {
			...prefs,
			bgsGroupQuestsByDifficulty: false,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
