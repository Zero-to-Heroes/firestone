import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { defaultStartingHp, GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { buildEntityFromBoardEntity } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsCardTooltipComponent } from '../bgs-card-tooltip.component';

@Component({
	selector: 'bgs-battle-recap',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-battle-recap.component.scss`],
	template: `
		<div class="bgs-battle-recap" [ngClass]="{ selectable: selectable }">
			<div class="turn-label" *ngIf="turnNumber">
				<div
					class="turn"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
				<div class="result {{ result }}" *ngIf="result">{{ i18nResult }}</div>
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
				<bgs-battle-status class="results" [showReplayLink]="true" [nextBattle]="battle"></bgs-battle-status>
				<div class="group opponent">
					<div class="board">
						<div
							class="minion-container"
							*ngFor="let entity of opponentEntities; let i = index; trackBy: trackByEntityFn"
							cachedComponentTooltip
							[componentType]="componentType"
							[componentInput]="entity"
							[componentTooltipPosition]="'left'"
						>
							<card-on-board class="minion" [entity]="entity"> </card-on-board>
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
		console.debug('setting faceOff', value);
		this.turnNumber = value.turn;
		this.result = value.result;
		this.i18nResult = value.result
			? this.i18n.translateString(`battlegrounds.battle.result.${value.result}`)
			: undefined;

		this.playerHeroCardId = value.playerCardId;
		this.playerMaxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this.playerHeroCardId, this.allCards);
		this.playerHealth = value.playerHpLeft ?? value.battleInfo?.playerBoard?.player?.hpLeft;
		this.playerTavernTier = value.playerTavern ?? value.battleInfo?.playerBoard?.player?.tavernTier;

		this.battle = value;

		this.opponentHeroCardId = value.opponentCardId;
		this.opponentMaxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this.opponentHeroCardId, this.allCards);
		this.opponentHealth = value.opponentHpLeft ?? value.battleInfo?.opponentBoard?.player?.hpLeft;
		this.opponentTavernTier = value.opponentTavern ?? value.battleInfo?.opponentBoard?.player?.tavernTier;

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
	i18nResult: string;
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

	trackByEntityFn(index: number, entity: Entity) {
		return entity.id;
	}
}
