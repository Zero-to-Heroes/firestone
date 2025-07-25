import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import {
	BgsFaceOffWithSimulation,
	BgsGame,
	BgsPostMatchStatsPanel,
	BgsStatsFilterId,
	MinionStat,
	QuestReward,
} from '@firestone/game-state';
import { ENABLE_MULTI_GRAPHS, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, OwUtilsService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { normalizeCardId } from './card-utils';

@Component({
	standalone: false,
	selector: 'bgs-post-match-stats',
	styleUrls: [
		// `../in-game/bgs-opponent-overview-big.component.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content empty-state" *ngIf="!_panel?.player && !mainPlayerId">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">{{ emptyTitle }}</span>
				<span class="subtitle">{{ emptySubtitle }} </span>
			</div>
			<div class="content" *ngIf="_panel?.player || mainPlayerId">
				<social-shares
					*ngIf="showSocialShares"
					class="social-shares"
					[onSocialClick]="takeScreenshotFunction"
				></social-shares>
				<bgs-player-capsule [player]="_panel?.player" [rating]="mmr" class="opponent-overview">
					<div class="main-info">
						<bgs-board
							*ngIf="boardMinions && boardMinions.length > 0"
							[debug]="true"
							[entities]="boardMinions"
							[finalBoard]="true"
							[minionStats]="minionStats"
							[customTitle]="boardTitle"
						></bgs-board>
						<bgs-quest-rewards [rewards]="questRewards"></bgs-quest-rewards>
					</div>
				</bgs-player-capsule>
				<div class="tabs-container">
					<bgs-post-match-stats-tabs
						class="tab"
						[panel]="_panel"
						[mainPlayerId]="mainPlayerId"
						[selectedTab]="selectedTab$ | async"
					></bgs-post-match-stats-tabs>
					<!-- <div class="tabs-layout-selection" *ngIf="enableMultiGraphs || selectedTabs?.length > 1">
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
					</div> -->
				</div>
			</div>
			<div class="left empty" *ngIf="!_panel?.player"></div>
			<div class="left" *ngIf="_panel?.player && !(showAds$ | async)">
				<div class="title" [owTranslate]="'battlegrounds.post-match-stats.title'"></div>
				<bgs-post-match-stats-recap
					[stats]="_panel"
					[reviewId]="reviewId"
					[faceOffs]="faceOffs"
				></bgs-post-match-stats-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showAds$: Observable<boolean>;
	selectedTab$: Observable<BgsStatsFilterId>;

	enableMultiGraphs = ENABLE_MULTI_GRAPHS;

	@Input() loadingTitle = "We're building the stats";
	@Input() loadingSubtitle: string;
	@Input() loadingSvg = 'ftue/battlegrounds';
	@Input() showHints = true;
	@Input() hideDefaultLoadingSubtitle: boolean;
	@Input() showSocialShares = true;

	@Input() emptyTitle = 'Nothing here yet';
	@Input() emptySubtitle = 'Finish the run to get some stats!';
	@Input() parentWindow = `Firestone - Battlegrounds`;
	@Input() mainPlayerId: number;

	@Input() reviewId?: string;
	@Input() faceOffs: readonly BgsFaceOffWithSimulation[];
	@Input() mmr: number;
	@Input() set gameEnded(value: boolean) {
		this.boardTitle = value
			? this.i18n.translateString('battlegrounds.post-match-stats.final-board')
			: this.i18n.translateString('battlegrounds.post-match-stats.current-board');
	}

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		console.debug('[bgs-post-match-stats] setting panel', value);
		if (!value?.player || value === this._panel) {
			return;
		}
		this._panel = value;
		this.icon = this.i18n.getCardImage(value.player.getDisplayCardId(), { isBgs: true });
		this.health = value.player.initialHealth + value.player.currentArmor - value.player.damageTaken;
		this.maxHealth = value.player.initialHealth;
		this.heroPowerCardId = value.player.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.player.name;
		this.tavernTier = value.player.getCurrentTavernTier();
		this.boardMinions = value.player.getLastKnownBoardStateAsReplayEntities();
		if (!this.boardMinions || this.boardMinions.length === 0) {
			console.warn('missing board minions in final board state', value.player.boardHistory?.length);
		}
		this.addMinionStats();
		this.questRewards = value.player.questRewards;
		this.allTabs$$.next(value.tabs);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_panel: BgsPostMatchStatsPanel;
	_game: BgsGame;

	loadingElapsed = 0;
	boardTitle = this.i18n.translateString('battlegrounds.post-match-stats.current-board');
	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[] = [];
	minionStats: readonly MinionStat[];
	questRewards: readonly QuestReward[];

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();

	private allTabs$$ = new BehaviorSubject<BgsStatsFilterId[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly owUtils: OwUtilsService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ads: AdService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((showAds) => !showAds));
		this.selectedTab$ = combineLatest([this.allTabs$$, this.prefs.preferences$$]).pipe(
			filter(([tabs, prefs]) => !!tabs?.length && !!prefs),
			this.mapData(([tabs, prefs]) => (tabs.includes(prefs.bgsSelectedTab3) ? prefs.bgsSelectedTab3 : tabs[0])),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
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
}
