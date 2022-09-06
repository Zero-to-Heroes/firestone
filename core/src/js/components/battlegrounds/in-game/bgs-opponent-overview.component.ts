import { AfterViewInit, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsPlayer, QuestReward } from '../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';

@Component({
	selector: 'bgs-opponent-overview',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview.component.scss`,
	],
	template: `
		<div class="opponent-overview">
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerCardId"
					[cardTooltipText]="name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
				<!-- <div class="name">{{ name }}</div> -->
				<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="boardTurn"
					[tooltipPosition]="'top'"
				></bgs-board>
			</div>
			<div class="tavern-upgrades">
				<div class="title" *ngIf="tavernUpgrades?.length" [owTranslate]="'battlegrounds.in-game.opponents.tavern-last-upgrade-title'"></div>
				<div class="upgrades" *ngIf="tavernUpgrades?.length">
					<div class="tavern-upgrade" *ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn">
						<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
						<div
							class="label"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: upgrade.turn }"
						></div>
					</div>
				</div>
				<div
					class="subtitle"
					*ngIf="!tavernUpgrades?.length"
					[owTranslate]="'battlegrounds.in-game.opponents.tavern-empty-state'"
				></div>
			</div>
			<!-- <bgs-buddies [buddies]="buddies"></bgs-buddies> -->
			<bgs-quest-rewards [rewards]="questRewards"></bgs-quest-rewards>
			<bgs-triples [triples]="triples" [boardTurn]="boardTurn"></bgs-triples>
			<div
				class="last-opponent-icon"
				*ngIf="showLastOpponentIcon"
				[helpTooltip]="'last-opponent-icon-tooltip' | owTranslate"
				inlineSVG="assets/svg/last_opponent.svg"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent implements AfterViewInit {
	heroCardId: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: BgsTavernUpgrade[];
	triples: readonly BgsTriple[];
	questRewards: readonly QuestReward[];
	debug = false;
	// buddies: readonly number[];

	@Input() showLastOpponentIcon: boolean;

	@Input() currentTurn: number;

	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			return;
		}
		this.debug = false; //value.cardId === 'TB_BaconShop_HERO_01';
		if (this.debug) {
		}
		this._opponent = value;
		if (!value) {
			console.warn('[opponent-overview] setting empty value');
			return;
		}
		this.heroCardId = value.getDisplayCardId();
		this.health = value.initialHealth - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.name;
		this.tavernTier = value.getCurrentTavernTier();
		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.tavernUpgrades = [...value.tavernUpgradeHistory].reverse();
		this.triples = value.tripleHistory;
		this.questRewards = value.questRewards;
		// this.buddies = value.buddyTurns;
	}

	private _opponent: BgsPlayer;

	constructor(private readonly allCards: CardsFacadeService) {}

	ngAfterViewInit() {
		if (this.debug) {
		}
	}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
