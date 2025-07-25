import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BgsFaceOffWithSimulation, BgsPostMatchStatsPanel, BgsStatsFilterId } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isSupportedScenario } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'bgs-post-match-stats-tabs',
	styleUrls: [`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats-tabs.component.scss`],
	template: `
		<div class="stats">
			<ul class="tabs">
				<li
					*ngFor="let tab of tabs"
					class="tab"
					[ngClass]="{ active: tab === selectedTab }"
					(mousedown)="selectTab(tab)"
				>
					{{ getLabel(tab) }}
				</li>
			</ul>
			<ng-container *ngIf="{ heroStat: heroStat$ | async } as value">
				<bgs-chart-hp
					class="stat"
					*ngIf="selectedTab === 'hp-by-turn'"
					[stats]="_panel?.stats"
					[mainPlayerId]="mainPlayerId"
					[visible]="selectedTab === 'hp-by-turn'"
				>
				</bgs-chart-hp>
				<bgs-winrate-chart
					class="stat"
					*ngIf="selectedTab === 'winrate-per-turn'"
					[heroStat]="value.heroStat"
					[battleResultHistory]="_panel?.stats?.battleResultHistory"
				>
				</bgs-winrate-chart>
				<bgs-chart-warband-stats
					class="stat"
					*ngIf="selectedTab === 'warband-total-stats-by-turn'"
					[heroStat]="value.heroStat"
					[stats]="_panel?.stats"
				>
				</bgs-chart-warband-stats>
				<bgs-chart-warband-composition
					class="stat"
					*ngIf="selectedTab === 'warband-composition-by-turn'"
					[stats]="_panel?.stats"
					[availableTribes]="_panel?.availableTribes"
					[visible]="selectedTab === 'warband-composition-by-turn'"
					[invalidLimit]="1"
				>
				</bgs-chart-warband-composition>
				<bgs-battles-view
					class="stat battles"
					*ngIf="selectedTab === 'battles'"
					[faceOffs]="faceOffs"
					[isMainWindow]="true"
				></bgs-battles-view>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsTabsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	_panel: BgsPostMatchStatsPanel;
	tabs: readonly BgsStatsFilterId[];
	faceOffs: readonly BgsFaceOffWithSimulation[];

	heroStat$: Observable<BgsMetaHeroStatTierItem>;

	private currentHeroId$$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

	@Input() selectedTab: BgsStatsFilterId;
	@Input() selectTabHandler: (tab: BgsStatsFilterId, tabIndex: number) => void;
	@Input() mainPlayerId: number;

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.currentHeroId$$.next(value.player.cardId);
		this.tabs = value.tabs;
		this.faceOffs = (value.stats?.faceOffs ?? [])
			.map((faceOff) => {
				const battle: any =
					value.stats?.battleResultHistory?.find((battleResult) => battleResult.turn === faceOff.turn) ?? {};
				const isSupported = isSupportedScenario(battle.battleInfo);
				const battleMessage = isSupported?.reason;
				return {
					...faceOff,
					battleInfo: {
						...(battle.battleInfo ?? {}),
						gameState: {
							...(battle.battleInfo?.gameState ?? {}),
							anomalies: value.anomalies ?? [],
						},
					},
					battleResult: battle?.simulationResult,
					battleInfoMesage: battleMessage,
				} as BgsFaceOffWithSimulation;
			})
			.reverse();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.playerHeroStats);

		this.heroStat$ = combineLatest([
			this.playerHeroStats.tiersWithPlayerData$$,
			this.currentHeroId$$.asObservable(),
		]).pipe(
			filter(([heroStats, heroId]) => !!heroStats?.length && !!heroId),
			this.mapData(([heroStats, heroId]) => heroStats.find((stat) => stat.id === heroId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async selectTab(tab: BgsStatsFilterId) {
		console.debug('[bgs-post-match-stats-tabs] selectTab', tab, this.selectedTab, this.selectTabHandler);
		if (this.selectedTab === tab) {
			return;
		}
		await this.prefs.updatePrefs('bgsSelectedTab3', tab);
	}

	getLabel(tab: BgsStatsFilterId): string {
		return this.i18n.translateString(`battlegrounds.post-match-stats.tabs.${tab}`);
	}
}
