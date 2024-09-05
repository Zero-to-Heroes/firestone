import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsPlayer, BgsTavernUpgrade } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-simulator-player-overview',
	styleUrls: [`./bgs-simulator-player-overview.component.scss`],
	template: `
		<div class="opponent-overview">
			<div class="trinkets" *ngIf="!!greaterTrinketIcon || !!lesserTrinketIcon">
				<div class="trinket greater" *ngIf="!!greaterTrinketIcon">
					<div class="item-container" [cardTooltip]="_greaterTrinketCardId" [cardTooltipBgs]="true">
						<img [src]="greaterTrinketIcon" class="image" />
						<img
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/simulator/trinket_frame.png"
							class="frame"
						/>
					</div>
				</div>
				<div class="trinket lesser" *ngIf="!!lesserTrinketIcon">
					<div class="item-container" [cardTooltip]="_lesserTrinketCardId" [cardTooltipBgs]="true">
						<img [src]="lesserTrinketIcon" class="image" />
						<img
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/simulator/trinket_frame.png"
							class="frame"
						/>
					</div>
				</div>
			</div>
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerCardId"
					[cardTooltipClass]="'bgs-hero-power'"
					[name]="name"
					[mmr]="mmr"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="boardMinions"
					[boardTurn]="boardTurn"
					[tooltipPosition]="'top'"
					[showBoardMessage]="showBoardMessage"
					[customTitle]="emptyBoardMessage"
				></bgs-board>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorPlayerOverviewComponent {
	heroCardId: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	mmr: number | null;
	tavernTier: number;
	boardMinions: readonly Entity[];
	boardTurn: number;
	greaterTrinketIcon: string | null;
	lesserTrinketIcon: string | null;
	_greaterTrinketCardId: string | null | undefined;
	_lesserTrinketCardId: string | null | undefined;

	@Input() showBoardMessage = true;
	@Input() emptyBoardMessage: string;

	@Input() set opponent(value: BgsPlayer | null) {
		if (value === this._opponent) {
			return;
		}
		if (!value) {
			console.warn('[opponent-overview] setting empty value');
			return;
		}
		this._opponent = value;
		this.heroCardId = value.getDisplayCardId();
		this.health = value.initialHealth + value.currentArmor - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.name;
		this.mmr = value.mmr;
		this.tavernTier = value.getCurrentTavernTier();
		this.boardMinions = value.getLastKnownBoardStateAsReplayEntities() ?? [];
		this._greaterTrinketCardId = value.greaterTrinket;
		this.greaterTrinketIcon = !!this._greaterTrinketCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._greaterTrinketCardId}.jpg`
			: null;
		this._lesserTrinketCardId = value.lesserTrinket;
		this.lesserTrinketIcon = !!this._lesserTrinketCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._lesserTrinketCardId}.jpg`
			: null;
	}

	private _opponent: BgsPlayer;

	constructor(private readonly allCards: CardsFacadeService) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
