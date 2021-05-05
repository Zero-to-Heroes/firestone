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
import { BgsChangePostMatchStatsTabsNumberEvent } from '../../../services/battlegrounds/store/events/bgs-change-post-match-stats-tabs-number-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { FeatureFlags } from '../../../services/feature-flags';
import { CARDS_VERSION } from '../../../services/hs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';
import { normalizeCardId } from './card-utils';

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
			<div class="content" *ngIf="_panel?.player || mainPlayerCardId">
				<social-shares
					*ngIf="showSocialShares"
					class="social-shares"
					[onSocialClick]="takeScreenshotFunction"
				></social-shares>
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
				<div class="tabs-container multi-{{ selectedTabs.length }}">
					<bgs-post-match-stats-tabs
						*ngFor="let selectedTab of selectedTabs; let i = index"
						class="tab tab-{{ i + 1 }}"
						[game]="_game"
						[panel]="_panel"
						[mainPlayerCardId]="mainPlayerCardId"
						[selectedTab]="selectedTab"
						[selectTabHandler]="selectTabHandler"
						[tabIndex]="i"
					></bgs-post-match-stats-tabs>
					<div class="tabs-layout-selection" *ngIf="enableMultiGraphs || selectedTabs?.length > 1">
						<div class="layout one" (click)="changeTabsNumberHandler(1)" helpTooltip="Show a single graph">
							1
						</div>
						<div
							class="layout two"
							(click)="changeTabsNumberHandler(2)"
							helpTooltip="Show two graphs side-by-side"
						>
							2
						</div>
						<div
							class="layout four"
							(click)="changeTabsNumberHandler(4)"
							helpTooltip="Show four graphs in a grid"
						>
							4
						</div>
					</div>
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
	enableMultiGraphs = FeatureFlags.ENABLE_MULTI_GRAPHS;

	@Input() loadingTitle = "We're building the stats";
	@Input() loadingSubtitle: string;
	@Input() loadingSvg = 'ftue/battlegrounds';
	@Input() showHints = true;
	@Input() hideDefaultLoadingSubtitle: boolean;
	@Input() showSocialShares = true;

	@Input() emptyTitle = 'Nothing here yet';
	@Input() emptySubtitle = 'Finish the run to get some stats!';
	@Input() parentWindow = `Firestone - Battlegrounds`;
	@Input() mainPlayerCardId?: string;
	@Input() inputMmr?: number;

	@Input() selectedTabs: readonly BgsStatsFilterId[] = [];
	@Input() selectTabHandler: (tab: BgsStatsFilterId, tabIndex: number) => void;
	@Input() changeTabsNumberHandler: (numberOfTabs: number) => void = (numberOfTabs: number) => {
		this.battlegroundsUpdater.next(new BgsChangePostMatchStatsTabsNumberEvent(numberOfTabs));
	};

	@Input() set game(value: BgsGame) {
		if (value === this._game) {
			return;
		}
		this._game = value;
		this.mmr = value ? value.mmrAtStart : undefined;
		this.boardTitle = this._game?.gameEnded ? 'Your final board' : 'Your current board';
	}

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.player.getDisplayCardId()}.png?v=3`;
		this.health = value.player.initialHealth - value.player.damageTaken;
		this.maxHealth = value.player.initialHealth;
		this.heroPowerCardId = value.player.getDisplayHeroPowerCardId();
		this.name = value.player.name;
		this.tavernTier = value.player.getCurrentTavernTier();
		this.boardMinions = value.player.getLastKnownBoardState();
		if (!this.boardMinions || this.boardMinions.length === 0) {
			console.warn('missing board minions in final board state', value.player.boardHistory?.length);
		}
		let tabs = value.selectedStats ?? this.selectedTabs ?? ['hp-by-turn'];
		if (!FeatureFlags.ENABLE_MULTI_GRAPHS) {
			// Hard-code first tab to prevent weird bug where multi select is still occurring
			tabs = [tabs[0]];
		}
		const numberOfTabsToShow = value.numberOfDisplayedTabs ?? 1;
		this.selectedTabs = tabs.slice(0, numberOfTabsToShow);
		this.addMinionStats();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_panel: BgsPostMatchStatsPanel;
	_game: BgsGame;

	loadingElapsed = 0;
	boardTitle = 'Your current board';
	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[] = [];
	minionStats: readonly MinionStat[];
	mmr: number;
	showAds = true;

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();

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

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		// console.log('taking screenshot from bgs-post-match');
		return (copyToCliboard: boolean) => this.owUtils.captureWindow(this.parentWindow, copyToCliboard);
	}

	private addMinionStats() {
		if (!this.boardMinions?.length) {
			return;
		}
		const normalizedIds = [
			...new Set(this.boardMinions.map((entity) => normalizeCardId(entity.cardID, this.allCards))),
		];
		this.minionStats = normalizedIds.map(
			(cardId) =>
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
			.filter((cardId) => normalizeCardId(cardId, this.allCards) === normalizedCardId)
			.map((cardId) => totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
	}

	private async init() {
		this.allCards.initializeCardsDb(CARDS_VERSION);
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
