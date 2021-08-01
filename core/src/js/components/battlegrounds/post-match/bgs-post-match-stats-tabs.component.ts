import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { BgsPostMatchStatsFilterChangeEvent } from '../../../services/battlegrounds/store/events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'bgs-post-match-stats-tabs',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats-tabs.component.scss`,
	],
	template: `
		<div class="stats">
			<ul class="tabs">
				<li
					*ngFor="let tab of tabs"
					class="tab"
					[ngClass]="{ 'active': tab === selectedTab }"
					(mousedown)="selectTab(tab)"
				>
					{{ getLabel(tab) }}
				</li>
			</ul>
			<ng-container>
				<bgs-chart-hp
					class="stat"
					*ngxCacheIf="selectedTab === 'hp-by-turn'"
					[stats]="_panel?.stats"
					[mainPlayerCardId]="_game?.getMainPlayer()?.cardId || mainPlayerCardId"
					[visible]="selectedTab === 'hp-by-turn'"
					[tooltipSuffix]="tabIndex"
				>
				</bgs-chart-hp>
				<bgs-winrate-chart
					class="stat"
					*ngxCacheIf="selectedTab === 'winrate-per-turn'"
					[player]="_panel?.player"
					[globalStats]="_panel?.globalStats"
					[stats]="_panel?.stats"
				>
				</bgs-winrate-chart>
				<bgs-chart-warband-stats
					class="stat"
					*ngxCacheIf="selectedTab === 'warband-total-stats-by-turn'"
					[player]="_panel?.player"
					[globalStats]="_panel?.globalStats"
					[stats]="_panel?.stats"
				>
				</bgs-chart-warband-stats>
				<bgs-chart-warband-composition
					class="stat"
					*ngxCacheIf="selectedTab === 'warband-composition-by-turn'"
					[stats]="_panel?.stats"
					[availableTribes]="_panel?.availableTribes"
					[visible]="selectedTab === 'warband-composition-by-turn'"
					[invalidLimit]="1"
				>
				</bgs-chart-warband-composition>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsTabsComponent implements AfterViewInit {
	_panel: BgsPostMatchStatsPanel;
	_game: BgsGame;
	tabs: readonly BgsStatsFilterId[];

	@Input() selectedTab: BgsStatsFilterId;
	@Input() selectTabHandler: (tab: BgsStatsFilterId, tabIndex: number) => void;
	@Input() mainPlayerCardId?: string;
	@Input() tabIndex = 0;

	@Input() set game(value: BgsGame) {
		if (value === this._game) {
			return;
		}
		this._game = value;
	}

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.tabs = value.tabs;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTab(tab: BgsStatsFilterId) {
		// console.log('selecting tab', tab);
		this.selectTabHandler
			? this.selectTabHandler(tab, this.tabIndex)
			: this.battlegroundsUpdater.next(new BgsPostMatchStatsFilterChangeEvent(tab, this.tabIndex));
	}

	getLabel(tab: BgsStatsFilterId): string {
		switch (tab) {
			case 'hp-by-turn':
				return 'Health by turn';
			case 'stats':
				return 'Stats';
			case 'warband-composition-by-turn':
				return 'Compositions';
			case 'warband-total-stats-by-turn':
				return 'Warband stats';
			case 'winrate-per-turn':
				return 'Winrate';
		}
	}
}
