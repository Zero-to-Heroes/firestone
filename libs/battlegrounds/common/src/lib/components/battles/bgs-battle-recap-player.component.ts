import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType, defaultStartingHp } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsCardTooltipComponent, buildEntityFromBoardEntity } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-battle-recap-player',
	styleUrls: [`./bgs-battle-recap-player.component.scss`],
	template: `
		<div class="group player" [ngClass]="{ 'has-trinkets': !!trinkets?.length }">
			<div class="hero">
				<bgs-trinkets
					class="trinkets"
					[trinkets]="trinkets"
					[showTitle]="false"
					*ngIf="!!trinkets?.length"
				></bgs-trinkets>
				<bgs-hero-portrait
					class="portrait"
					[heroCardId]="playerHeroCardId"
					[health]="playerHealth"
					[maxHealth]="playerMaxHealth"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="playerTavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="board">
				<div
					class="minion-container"
					*ngFor="let entity of playerEntities; let i = index; trackBy: trackByEntityFn"
					cachedComponentTooltip
					[componentType]="componentType"
					[componentInput]="entity"
					[componentTooltipPosition]="'right'"
				>
					<card-on-board class="minion" [entity]="entity"> </card-on-board>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleRecapPlayerComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() set player(value: BattleRecapPlayer) {
		if (!value) {
			return;
		}
		this.playerHeroCardId = value.heroCardId;
		this.playerMaxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this.playerHeroCardId, this.allCards);
		this.playerHealth = value.health;
		this.playerTavernTier = value.tavernTier;

		if (value.board) {
			this.playerEntities =
				value?.board?.board?.map((minion) => buildEntityFromBoardEntity(minion, this.allCards)) ?? [];
			this.trinkets = value.board.player.trinkets?.map((trinket) => trinket.cardId) ?? [];
		}
	}

	playerHeroCardId: string;
	playerHealth: number;
	playerMaxHealth: number;
	playerTavernTier: number;
	playerEntities: readonly Entity[];
	trinkets: readonly string[];

	constructor(private readonly allCards: CardsFacadeService) {}

	trackByEntityFn(index: number, entity: Entity) {
		return entity.id;
	}
}

export interface BattleRecapPlayer {
	readonly heroCardId: string;
	readonly health: number;
	readonly tavernTier: number;
	readonly board: BgsBoardInfo | null;
}
