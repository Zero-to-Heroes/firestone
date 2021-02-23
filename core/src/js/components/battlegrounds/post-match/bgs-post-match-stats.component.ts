import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { MinionStat } from '../../../models/battlegrounds/post-match/minion-stat';
import { AdService } from '../../../services/ad.service';
import { BgsPostMatchStatsFilterChangeEvent } from '../../../services/battlegrounds/store/events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';
import { normalizeCardId } from './card-utils';

declare let amplitude: any;

@Component({
	selector: 'bgs-post-match-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats.component.scss`,
	],
	template: `
		<div class="container" [ngClass]="{ 'no-ads': !showAds }">
			<div class="content empty-state" *ngIf="!_panel?.player && !mainPlayerCardId">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">{{ emptyTitle }}</span>
				<span class="subtitle">{{ emptySubtitle }} </span>
			</div>
			<div class="content">
				<social-shares class="social-shares" [onSocialClick]="takeScreenshotFunction"></social-shares>
				<bgs-player-capsule [player]="_panel?.player" [rating]="mmr || inputMmr" class="opponent-overview">
					<div class="main-info">
						<bgs-board
							*ngIf="boardMinions && boardMinions.length > 0"
							[debug]="true"
							[entities]="boardMinions"
							[finalBoard]="true"
							[minionStats]="minionStats"
							[maxBoardHeight]="-1"
							[customTitle]="boardTitle"
						></bgs-board>
					</div>
				</bgs-player-capsule>
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
							[visible]="selectedTab === 'warband-composition-by-turn'"
						>
						</bgs-chart-warband-composition>
					</ng-container>
				</div>
			</div>
			<div class="left empty" *ngIf="!_panel?.player"></div>
			<div class="left" *ngIf="_panel?.player">
				<div class="title">Last Match Stats</div>
				<bgs-post-match-stats-recap [stats]="_panel" [game]="_game"></bgs-post-match-stats-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsComponent implements AfterViewInit {
	loadingElapsed = 0;

	@Input() loadingTitle = "We're building the stats";
	@Input() loadingSubtitle: string;
	@Input() loadingSvg = 'ftue/battlegrounds';
	@Input() showHints = true;
	@Input() hideDefaultLoadingSubtitle: boolean;

	_panel: BgsPostMatchStatsPanel;
	_game: BgsGame;

	boardTitle = 'Your current board';
	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[] = [];
	minionStats: readonly MinionStat[];
	tabs: readonly BgsStatsFilterId[];
	// computing: boolean;
	mmr: number;
	showAds = true;

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();

	private loadingStart: number;
	private loadingInterval;

	@Input() emptyTitle = 'Nothing here yet';
	@Input() emptySubtitle = 'Finish the run to get some stats!';
	@Input() parentWindow = `Firestone - Battlegrounds`;
	@Input() selectedTab: BgsStatsFilterId;
	@Input() mainPlayerCardId?: string;
	@Input() inputMmr?: number;
	@Input() selectTabHandler: (tab: BgsStatsFilterId) => void;

	@Input() set game(value: BgsGame) {
		if (value === this._game) {
			return;
		}
		this._game = value;
		this.mmr = value ? value.mmrAtStart : undefined;
		this.boardTitle = this._game.gameEnded ? 'Your final board' : 'Your current board';
	}

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		// if (value) {
		// 	// this.computing = value.isComputing;
		// 	// if (this.computing) {
		// 	// 	if (this.loadingInterval) {
		// 	// 		clearInterval(this.loadingInterval);
		// 	// 	}
		// 	// 	this.loadingStart = Date.now();
		// 	// 	this.loadingInterval = setInterval(() => {
		// 	// 		this.loadingElapsed = (Date.now() - this.loadingStart) / 1000;
		// 	// 		if (!(this.cdr as ViewRef)?.destroyed) {
		// 	// 			this.cdr.detectChanges();
		// 	// 		}
		// 	// 	}, 500);
		// 	// }
		// }
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.player.getDisplayCardId()}.png`;
		this.health = value.player.initialHealth - value.player.damageTaken;
		this.maxHealth = value.player.initialHealth;
		this.heroPowerCardId = value.player.getDisplayHeroPowerCardId();
		this.name = value.player.name;
		this.tavernTier = value.player.getCurrentTavernTier();
		this.boardMinions = value.player.getLastKnownBoardState();
		if (!this.boardMinions || this.boardMinions.length === 0) {
			console.warn('missing board minions in final board state', value.player.boardHistory?.length);
		}
		this.tabs = value.tabs;
		this.selectedTab = value.selectedStat ?? this.selectedTab;
		this.addMinionStats();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly owUtils: OwUtilsService,
		private readonly ads: AdService,
	) {
		// console.log('in construftor');
		this.init();
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTab(tab: BgsStatsFilterId) {
		console.log('selecting tab', tab);
		this.selectTabHandler
			? this.selectTabHandler(tab)
			: this.battlegroundsUpdater.next(new BgsPostMatchStatsFilterChangeEvent(tab));
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

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		// console.log('taking screenshot from bgs-post-match');
		return (copyToCliboard: boolean) => this.owUtils.captureWindow(this.parentWindow, copyToCliboard);
	}

	private addMinionStats() {
		if (!this.boardMinions?.length) {
			return;
		}
		const normalizedIds = [
			...new Set(this.boardMinions.map(entity => normalizeCardId(entity.cardID, this.allCards))),
		];
		this.minionStats = normalizedIds.map(
			cardId =>
				({
					cardId: cardId,
					damageDealt: this.extractDamage(cardId, this._panel.stats?.totalMinionsDamageDealt),
					damageTaken: this.extractDamage(cardId, this._panel.stats?.totalMinionsDamageTaken),
				} as MinionStat),
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private extractDamage(normalizedCardId: string, totalMinionsDamageDealt: { [cardId: string]: number }): number {
		if (!totalMinionsDamageDealt) {
			return 0;
		}
		return Object.keys(totalMinionsDamageDealt)
			.filter(cardId => normalizeCardId(cardId, this.allCards) === normalizedCardId)
			.map(cardId => totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
	}

	private async init() {
		this.allCards.initializeCardsDb();
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
