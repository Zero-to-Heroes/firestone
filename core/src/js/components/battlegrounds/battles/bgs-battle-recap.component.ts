import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { buildEntityFromBoardEntity } from '../../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { defaultStartingHp } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsCardTooltipComponent } from '../bgs-card-tooltip.component';

declare let amplitude;

@Component({
	selector: 'bgs-battle-recap',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battle-recap.component.scss`,
	],
	template: `
		<div class="bgs-battle-recap" [ngClass]="{ 'selectable': selectable }">
			<div class="turn-label" *ngIf="turnNumber">
				<div
					class="turn"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
				<div class="result {{ result }}" *ngIf="result">{{ result }}</div>
			</div>
			<div class="battle-content">
				<div class="group player">
					<div class="hero">
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
							*ngFor="let entity of playerEntities; let i = index"
							cachedComponentTooltip
							[componentType]="componentType"
							[componentInput]="entity"
							[componentTooltipPosition]="'right'"
						>
							<card-on-board class="minion" [entity]="entity" [useSvg]="false"> </card-on-board>
						</div>
					</div>
				</div>
				<bgs-battle-status class="results" [showReplayLink]="true" [nextBattle]="battle"></bgs-battle-status>
				<div class="group opponent">
					<div class="board">
						<div
							class="minion-container"
							*ngFor="let entity of opponentEntities; let i = index"
							cachedComponentTooltip
							[componentType]="componentType"
							[componentInput]="entity"
							[componentTooltipPosition]="'left'"
						>
							<card-on-board class="minion" [entity]="entity" [useSvg]="false"> </card-on-board>
						</div>
					</div>
					<div class="hero">
						<bgs-hero-portrait
							class="portrait"
							[heroCardId]="opponentHeroCardId"
							[health]="opponentHealth"
							[maxHealth]="opponentMaxHealth"
						></bgs-hero-portrait>
						<tavern-level-icon [level]="opponentTavernTier" class="tavern"></tavern-level-icon>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleRecapComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		if (!value) {
			return;
		}

		this.turnNumber = value.turn;
		this.result = value.result
			? this.i18n.translateString(`battlegrounds.battle.result.${value.result}`)
			: undefined;

		this.playerHeroCardId = value.playerCardId;
		this.playerHealth = value.playerHpLeft;
		this.playerMaxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this.playerHeroCardId);
		this.playerTavernTier = value.playerTavern;

		this.battle = value;

		this.opponentHeroCardId = value.opponentCardId;
		this.opponentHealth = value.opponentHpLeft;
		this.opponentMaxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this.opponentHeroCardId);
		this.opponentTavernTier = value.opponentTavern;

		this.selectable = true; // !!value.battleInfo;
		if (value.battleInfo) {
			this.playerEntities = value.battleInfo.playerBoard.board.map((minion) =>
				buildEntityFromBoardEntity(minion, this.allCards),
			);
			this.opponentEntities = value.battleInfo.opponentBoard.board.map((minion) =>
				buildEntityFromBoardEntity(minion, this.allCards),
			);
		}
	}

	turnNumber: number;
	result: string;
	selectable: boolean;
	playerHeroCardId: string;
	playerHealth: number;
	playerMaxHealth: number;
	playerTavernTier: number;
	playerEntities: readonly Entity[];
	battle: BgsFaceOffWithSimulation;
	opponentHeroCardId: string;
	opponentHealth: number;
	opponentMaxHealth: number;
	opponentTavernTier: number;
	opponentEntities: readonly Entity[];

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}
}
