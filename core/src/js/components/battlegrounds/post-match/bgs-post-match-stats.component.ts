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
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { MinionStat } from '../../../models/battlegrounds/post-match/minion-stat';
import { BgsPostMatchStatsFilterChangeEvent } from '../../../services/battlegrounds/store/events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { normalizeCardId } from './card-utils';

declare let amplitude: any;

@Component({
	selector: 'bgs-post-match-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content empty-state" *ngIf="!_panel?.isComputing && !_panel?.player">
				<i>
					<svg>
						<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">Nothing here yet</span>
				<span class="subtitle">Finish the run to get some stats!</span>
			</div>
			<div class="content empty-state" *ngIf="_panel?.isComputing">
				<i>
					<svg>
						<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">We are building the post-match stats, it should only take a few seconds</span>
			</div>
			<div class="content" *ngIf="!_panel?.isComputing && _panel?.player">
				<div class="opponent-overview">
					<div class="background-additions">
						<div class="top"></div>
						<div class="bottom"></div>
					</div>
					<div class="portrait">
						<bgs-hero-portrait
							class="icon"
							[icon]="icon"
							[health]="health"
							[maxHealth]="maxHealth"
							[cardTooltip]="heroPowerCardId"
							[cardTooltipText]="name"
							[cardTooltipClass]="'bgs-hero-power'"
						></bgs-hero-portrait>
						<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
					</div>
					<div class="opponent-info">
						<div class="main-info">
							<bgs-board
								[entities]="boardMinions"
								[finalBoard]="true"
								[minionStats]="minionStats"
								[maxBoardHeight]="0.7"
							></bgs-board>
						</div>
					</div>
				</div>
				<div class="stats">
					<ul class="tabs">
						<li
							*ngFor="let tab of tabs"
							class="tab"
							[ngClass]="{ 'active': tab === selectedTab }"
							(click)="selectTab(tab)"
						>
							{{ getLabel(tab) }}
						</li>
					</ul>
					<ng-container>
						<bgs-chart-hp
							class="stat"
							[hidden]="selectedTab !== 'hp-by-turn'"
							[stats]="_panel?.stats"
							[game]="_game"
						>
						</bgs-chart-hp>
						<bgs-chart-warband-stats
							class="stat"
							[hidden]="selectedTab !== 'warband-total-stats-by-turn'"
							[player]="_panel?.player"
							[globalStats]="_panel?.globalStats"
							[stats]="_panel?.stats"
						>
						</bgs-chart-warband-stats>
						<bgs-chart-warband-composition
							class="stat"
							[hidden]="selectedTab !== 'warband-composition-by-turn'"
							[stats]="_panel?.stats"
						>
						</bgs-chart-warband-composition>
						<!-- <bgs-chart-stats *ngSwitchCase="'stats'" class="stat" [stats]="_panel?.stats">
						</bgs-chart-stats> -->
					</ng-container>
				</div>
			</div>
			<div class="left empty" *ngIf="!_panel?.player"></div>
			<div class="left" *ngIf="_panel?.player">
				<div class="title">
					Last Match Stats
				</div>
				<bgs-post-match-stats-recap [stats]="_panel" [game]="_game"></bgs-post-match-stats-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsComponent implements AfterViewInit {
	_panel: BgsPostMatchStatsPanel;
	_game: BgsGame;

	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[];
	minionStats: readonly MinionStat[];
	tabs: readonly BgsStatsFilterId[];
	selectedTab: BgsStatsFilterId;

	@Input() set game(value: BgsGame) {
		if (value === this._game) {
			// console.log('same game');
			return;
		}
		this._game = value;
	}

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		// console.log('will set panel?', value);
		if (!value?.player) {
			// console.log('no player, returning');
			return;
		}
		if (value === this._panel) {
			// console.log('same panel');
			return;
		}
		// console.log('setting panel');
		this._panel = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.player.cardId}.png`;
		this.health = value.player.initialHealth - value.player.damageTaken;
		this.maxHealth = value.player.initialHealth;
		this.heroPowerCardId = value.player.heroPowerCardId;
		this.name = value.player.name;
		this.tavernTier = value.player.getCurrentTavernTier();
		this.boardMinions = value.player.getLastKnownBoardState();
		this.tabs = value.tabs;
		this.selectedTab = value.selectedStat;
		this.addMinionStats();
		// console.log('panel info set');
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
	) {
		// console.log('in construftor');
		allCards.initializeCardsDb();
	}

	async ngAfterViewInit() {
		// console.log('after view init');
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTab(tab: BgsStatsFilterId) {
		this.battlegroundsUpdater.next(new BgsPostMatchStatsFilterChangeEvent(tab));
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
		}
	}

	private addMinionStats() {
		// // Only needed in dev when hard refreshing the page
		// if (!this.allCards.getCards()?.length) {
		// 	console.log('starting db init');
		// 	await this.allCards.initializeCardsDb();
		// 	console.log('db init done');
		// }
		// console.log('cards ready', this.allCards.getCards()?.length);
		const normalizedIds = [
			...new Set(this.boardMinions.map(entity => normalizeCardId(entity.cardID, this.allCards))),
		];
		this.minionStats = normalizedIds.map(
			cardId =>
				({
					cardId: cardId,
					damageDealt: this.extractDamage(cardId, this._panel.stats.totalMinionsDamageDealt),
					damageTaken: this.extractDamage(cardId, this._panel.stats.totalMinionsDamageTaken),
				} as MinionStat),
		);
		// console.log('minion stats', this.minionStats);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private extractDamage(normalizedCardId: string, totalMinionsDamageDealt: { [cardId: string]: number }): number {
		return Object.keys(totalMinionsDamageDealt)
			.filter(cardId => normalizeCardId(cardId, this.allCards) === normalizedCardId)
			.map(cardId => totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
	}
}
