import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsPostMatchStatsFilterChangeEvent } from '../../../services/battlegrounds/store/events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
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
					[mainPlayerCardId]="mainPlayerCardId"
					[visible]="selectedTab === 'hp-by-turn'"
					[tooltipSuffix]="tabIndex"
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
					class="stat"
					*ngIf="selectedTab === 'battles'"
					[faceOffs]="faceOffs"
					[isMainWindow]="true"
				></bgs-battles-view>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsTabsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	_panel: BgsPostMatchStatsPanel;
	tabs: readonly BgsStatsFilterId[];
	faceOffs: readonly BgsFaceOffWithSimulation[];

	heroStat$: Observable<BgsHeroStat>;

	private currentHeroId$$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

	@Input() selectedTab: BgsStatsFilterId;
	@Input() selectTabHandler: (tab: BgsStatsFilterId, tabIndex: number) => void;
	@Input() mainPlayerCardId: string;
	@Input() tabIndex = 0;

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.currentHeroId$$.next(value.player.cardId);
		this.tabs = value.tabs;
		this.faceOffs = (value.stats?.faceOffs ?? [])
			.map((faceOff) => {
				const battle = value.stats?.battleResultHistory?.find(
					(battleResult) => battleResult.turn === faceOff.turn,
				);
				return {
					...faceOff,
					battleInfo: (battle as any)?.battleInfo,
					battleResult: battle?.simulationResult,
				} as BgsFaceOffWithSimulation;
			})
			.reverse();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroStat$ = combineLatest(this.store.bgHeroStats$(), this.currentHeroId$$.asObservable()).pipe(
			filter(([heroStats, heroId]) => !!heroStats?.length && !!heroId),
			this.mapData(([heroStats, heroId]) => heroStats.find((stat) => stat.id === heroId)),
		);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTab(tab: BgsStatsFilterId) {
		this.selectTabHandler
			? this.selectTabHandler(tab, this.tabIndex)
			: this.battlegroundsUpdater.next(new BgsPostMatchStatsFilterChangeEvent(tab, this.tabIndex));
	}

	getLabel(tab: BgsStatsFilterId): string {
		return this.i18n.translateString(`battlegrounds.post-match-stats.tabs.${tab}`);
	}
}
