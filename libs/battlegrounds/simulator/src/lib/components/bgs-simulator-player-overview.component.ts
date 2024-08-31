import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsPlayer, BgsTavernUpgrade } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-simulator-player-overview',
	styleUrls: [`./bgs-simulator-player-overview.component.scss`],
	template: `
		<div class="opponent-overview">
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
	}

	private _opponent: BgsPlayer;

	constructor(private readonly allCards: CardsFacadeService) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
