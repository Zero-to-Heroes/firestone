import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
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
					[maxBoardHeight]="-1"
				></bgs-board>
				<div class="filler"></div>
			</div>
			<div class="tavern-upgrades" *ngIf="tavernUpgrades?.length">
				<div class="title">Last upgrades</div>
				<div class="upgrades">
					<div class="tavern-upgrade" *ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn">
						<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
						<div class="label">Turn {{ upgrade.turn }}</div>
					</div>
				</div>
			</div>
			<bgs-triples [triples]="triples" [boardTurn]="boardTurn"></bgs-triples>
			<div
				class="last-opponent-icon"
				*ngIf="showLastOpponentIcon"
				helpTooltip="Was last round's opponent"
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
	debug = false;

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
		// this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.getDisplayCardId()}.png?v=3`;
		this.health = value.initialHealth - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId();
		this.name = value.name;
		this.tavernTier = value.getCurrentTavernTier();
		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.tavernUpgrades = [...value.tavernUpgradeHistory].reverse();
		this.triples = value.tripleHistory;
	}

	private _opponent: BgsPlayer;

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	ngAfterViewInit() {
		if (this.debug) {
		}
	}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
