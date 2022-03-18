import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../models/battlegrounds/in-game/bgs-triple';

@Component({
	selector: 'bgs-player-capsule',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/component/battlegrounds/bgs-player-capsule.component.scss`,
	],
	template: `
		<div class="player-overview">
			<div class="background-additions">
				<div class="top"></div>
				<div class="bottom"></div>
			</div>
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerCardId"
					[cardTooltipText]="name"
					[cardTooltipClass]="'bgs-hero-power'"
					[rating]="rating"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern" *ngIf="tavernTier"></tavern-level-icon>
				<div
					class="last-opponent-icon"
					*ngIf="showLastOpponentIcon"
					[helpTooltip]="'battlegrounds.in-game.opponents.last-opponent-icon-tooltip' | owTranslate"
					inlineSVG="assets/svg/last_opponent.svg"
				></div>
			</div>
			<div class="player-info">
				<ng-content></ng-content>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPlayerCapsuleComponent {
	// icon: string;
	heroCardId: string;
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
	@Input() showLastOpponentIcon: boolean;
	@Input() displayTavernTier: boolean;

	@Input() set player(value: BgsPlayer) {
		if (value === this._player) {
			return;
		}
		this._player = value;
		if (!value) {
			console.warn('[opponent-big] setting empty value');
			return;
		}

		this.heroCardId = value.getDisplayCardId();
		this.health = value.initialHealth - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.name;
		this.tavernTier = this.displayTavernTier ? value.getCurrentTavernTier() : undefined;
		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.triples = value.tripleHistory;
		this.tavernUpgrades = value.tavernUpgradeHistory;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private _player: BgsPlayer;

	constructor(private readonly cdr: ChangeDetectorRef, private allCards: CardsFacadeService) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
