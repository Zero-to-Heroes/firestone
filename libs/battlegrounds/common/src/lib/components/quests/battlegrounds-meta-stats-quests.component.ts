import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsQuestsService } from '@firestone/battlegrounds/common';
import {
	BgsMetaQuestRewardStatTierItem,
	BgsMetaQuestStatTierItem,
	buildQuestRewardStats,
	buildQuestStats,
} from '@firestone/battlegrounds/data-access';
import { BgsQuestActiveTabType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	selector: 'battlegrounds-meta-stats-quests',
	styleUrls: [`./battlegrounds-meta-stats-quests.component.scss`],
	template: `
		<ng-container [ngSwitch]="questsTab$ | async">
			<ng-container *ngSwitchCase="'quests'">
				<ng-container *ngIf="{ questStats: questStats$ | async, lastUpdate: lastUpdate$ | async } as value">
					<battlegrounds-meta-stats-quests-view
						[stats]="value.questStats"
						[lastUpdate]="value.lastUpdate"
						[collapsedQuests]="collapsedQuests$ | async"
						[groupedByDifficulty]="groupedByDifficulty$ | async"
						(statClick)="onStatClicked($event)"
						(collapseAll)="onCollapseAll(value.questStats)"
						(expandAll)="onExpandAll()"
						(groupDifficulty)="onGroupDifficulty()"
						(ungroupDifficulty)="onUngroupDifficulty()"
					></battlegrounds-meta-stats-quests-view>
				</ng-container>
			</ng-container>
			<ng-container *ngSwitchCase="'rewards'">
				<ng-container *ngIf="{ rewardStats: rewardStats$ | async, lastUpdate: lastUpdate$ | async } as value">
					<battlegrounds-meta-stats-quest-rewards-view
						[stats]="value.rewardStats"
						[lastUpdate]="value.lastUpdate"
					></battlegrounds-meta-stats-quest-rewards-view>
				</ng-container>
			</ng-container>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	questsTab$: Observable<BgsQuestActiveTabType>;

	questStats$: Observable<readonly BgsMetaQuestStatTierItem[]>;
	collapsedQuests$: Observable<readonly string[]>;
	groupedByDifficulty$: Observable<boolean>;
	lastUpdate$: Observable<string | null>;

	rewardStats$: Observable<readonly BgsMetaQuestRewardStatTierItem[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly quests: BattlegroundsQuestsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();
		await this.quests.isReady();

		this.questsTab$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsQuestsActiveTab));
		this.groupedByDifficulty$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsGroupQuestsByDifficulty),
		);

		this.questStats$ = combineLatest([this.quests.questStats$$, this.groupedByDifficulty$]).pipe(
			this.mapData(([stats, bgsGroupQuestsByDifficulty]) =>
				buildQuestStats(stats?.questStats ?? [], bgsGroupQuestsByDifficulty, this.allCards),
			),
		);
		this.collapsedQuests$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsQuestsCollapsed ?? []));
		this.rewardStats$ = combineLatest([this.quests.questStats$$]).pipe(
			this.mapData(([stats]) => buildQuestRewardStats(stats?.rewardStats ?? [], this.allCards)),
		);
		this.lastUpdate$ = this.quests.questStats$$.pipe(
			this.mapData((stats) => (stats ? '' + stats.lastUpdateDate : null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	async onCollapseAll(stats: readonly BgsMetaQuestStatTierItem[] | null) {
		if (!stats) {
			return;
		}

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
