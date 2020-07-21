import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';

declare let amplitude: any;

@Component({
	selector: 'bgs-opponent-overview-big',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
	],
	template: `
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
					[rating]="rating"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="opponent-info">
				<div class="main-info">
					<bgs-board
						[entities]="boardMinions"
						[currentTurn]="currentTurn"
						[boardTurn]="boardTurn"
						[maxBoardHeight]="maxBoardHeight"
						[debug]="debug"
					></bgs-board>
					<div class="bottom-info">
						<bgs-triples [triples]="triples" [boardTurn]="boardTurn"></bgs-triples>
						<bgs-battle-status
							*ngIf="enableSimulation"
							[nextBattle]="nextBattle"
							[battleSimulationStatus]="battleSimulationStatus"
						></bgs-battle-status>
					</div>
				</div>
				<div class="tavern-upgrades">
					<div class="title">Tavern upgrades</div>
					<div class="upgrades">
						<div
							class="tavern-upgrade"
							*ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn"
						>
							<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
							<div class="label">Turn {{ upgrade.turn }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewBigComponent {
	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];

	@Input() rating: number;
	@Input() debug: boolean;
	@Input() enableSimulation: boolean;
	@Input() currentTurn: number;
	@Input() nextBattle: SimulationResult;
	@Input() battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';
	@Input() maxBoardHeight = 1;

	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			return;
		}
		this._opponent = value;
		if (!value) {
			console.warn('[opponent-big] setting empty value');
			return;
		}
		// console.log('setting next opponent info', value, value.getCurrentTavernTier());
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.getDisplayCardId()}.png`;
		this.health = value.initialHealth - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId();
		this.name = value.name;
		this.tavernTier = value.getCurrentTavernTier();
		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.triples = value.tripleHistory;
		this.tavernUpgrades = value.tavernUpgradeHistory;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private _opponent: BgsPlayer;

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
