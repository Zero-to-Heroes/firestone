import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds, GameType, TrinketSlot, defaultStartingHp } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import {
	BgsBoard,
	BgsCardTooltipComponent,
	BgsPlayer,
	buildEntityFromBoardEntity,
} from '@firestone/battlegrounds/core';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsSimulatorControllerService, Side } from '../services/sim-ui-controller/bgs-simulator-controller.service';

@Component({
	selector: 'bgs-simulator-side',
	styleUrls: [`./bgs-simulator-side.component.scss`],
	template: `
		<div class="bgs-battle-side" [ngClass]="{ 'with-duos': enableDuos }">
			<div class="teammate" *ngIf="enableDuos">
				<div class="add-teammate" *ngIf="!_teammate">
					<div class="add-teammate-button" (click)="addTeammate()">
						<div class="add-teammate-icon">+</div>
						<div class="add-teammate-text" [fsTranslate]="'battlegrounds.sim.add-teammate-button'"></div>
					</div>
				</div>
				<div class="teammate-recap" *ngIf="!!_teammate">
					<bgs-simulator-player-overview
						class="teammate-container"
						[opponent]="teammateShownInfo"
						[showBoardMessage]="!teammateShownInfo?.boardHistory?.length"
						[emptyBoardMessage]="'battlegrounds.sim.empty-teammate-board' | fsTranslate"
						[helpTooltip]="'battlegrounds.sim.teammate-board-tooltip' | fsTranslate"
						(click)="switchTeammates()"
					></bgs-simulator-player-overview>
					<div
						class="remove-teammate-button"
						inlineSVG="assets/svg/close.svg"
						(click)="removeTeammate()"
						[helpTooltip]="'battlegrounds.sim.remove-teammate-button' | fsTranslate"
					></div>
				</div>
			</div>
			<div class="hero">
				<bgs-hero-portrait-simulator
					class="portrait"
					[side]="side"
					[heroCardId]="heroCardId"
					[heroPowerCardId]="heroPowerCardId"
					[questRewardCardId]="questRewardCardId"
					[lesserTrinketCardId]="lesserTrinketCardId"
					[greaterTrinketCardId]="greaterTrinketCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[tavernTier]="tavernTier"
					[tooltipPosition]="tooltipPosition"
				></bgs-hero-portrait-simulator>
			</div>
			<div class="board" cdkDropListGroup (cdkDropListDropped)="drop($event)">
				<!-- See https://stackoverflow.com/questions/65726138/how-can-i-use-angular-material-drag-n-drop-with-flex-layout -->
				<div
					class="minion-container"
					*ngFor="let entity of entities; let i = index; trackBy: trackByFn"
					cdkDropList
					cdkDropListOrientation="horizontal"
					[cdkDropListData]="i"
					(cdkDropListDropped)="drop($event)"
					componentTooltip
					[componentType]="componentType"
					[componentInput]="entity"
					[componentTooltipPosition]="'right'"
					[componentTooltipForceHide]="forceTooltipHidden"
				>
					<card-on-board
						class="minion"
						[entity]="entity"
						(mousedown)="preventAppDrag($event)"
						cdkDrag
						[cdkDragData]="entity"
						(cdkDropListDropped)="drop($event)"
					>
					</card-on-board>
					<div class="minion-controls">
						<bgs-plus-button
							class="button update"
							[useUpdateIcon]="true"
							(click)="updateMinion(entity, i)"
							[helpTooltip]="'battlegrounds.sim.update-minion-button-tooltip' | fsTranslate"
						></bgs-plus-button>
						<bgs-minus-button
							class="button remove"
							(click)="removeMinion(entity, i)"
							helpTooltip="Remove minion"
							[helpTooltip]="'battlegrounds.sim.remove-minion-button-tooltip' | fsTranslate"
						></bgs-minus-button>
					</div>
				</div>
				<div class="click-to-add" *ngIf="(entities?.length ?? 0) < 7">
					<bgs-plus-button
						class="change-icon"
						(click)="addMinion()"
						[helpTooltip]="'battlegrounds.sim.add-minion-button-tooltip' | fsTranslate"
					></bgs-plus-button>
					<div class="empty-minion" inlineSVG="assets/svg/bg_empty_minion.svg"></div>
				</div>
			</div>
			<!-- TODO: move this -->
			<!-- <div class="global-effects">
				<div class="header" [fsTranslate]="'battlegrounds.sim.global-effects-header'"></div>
				<fs-numeric-input-with-arrows
					class="input undead-army"
					[label]="undeadArmyLabel"
					[helpTooltip]="'battlegrounds.sim.undead-army-tooltip' | fsTranslate"
					[value]="undeadArmy"
					[debounceTime]="200"
					(fsModelUpdate)="onUndeadArmyChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input eternal-legion"
					[label]="eternalLegionLabel"
					[helpTooltip]="'battlegrounds.sim.eternal-legion-tooltip' | fsTranslate"
					[value]="eternalLegion"
					[minValue]="0"
					[debounceTime]="200"
					(fsModelUpdate)="onEternalLegionChanged($event)"
				>
				</fs-numeric-input-with-arrows>
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorSideComponent {
	enableDuos = true;

	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() side: Side;

	@Input() set player(value: BgsBoardInfo | null) {
		this._player = value;
		this.updateInfo();
	}

	@Input() set teammate(value: BgsBoardInfo | null) {
		this._teammate = value;
		this.teammateShownInfo = this.toBgsPlayer(this._teammate);
		this.updateInfo();
	}

	@Input() tooltipPosition: CardTooltipPositionType;

	_player: BgsBoardInfo | null;
	_teammate: BgsBoardInfo | null;

	teammateShownInfo: BgsPlayer | null;

	heroCardId: string;
	heroPowerCardId: string | null | undefined;
	questRewardCardId: string | null | undefined;
	lesserTrinketCardId: string | null | undefined;
	greaterTrinketCardId: string | null | undefined;
	health: number;
	maxHealth: number;
	tavernTier: number;

	entities: readonly Entity[];

	undeadArmy: number;
	eternalLegion: number;
	tavernSpellsCastThisGame: number;
	piratesPlayedThisGame: number;
	piratesSummonedThisGame: number;
	beastsSummonedThisGame: number;
	magnetizedThisGame: number;

	undeadArmyLabel = this.allCards.getCard(CardIds.NerubianDeathswarmer_UndeadArmyEnchantment).name;
	eternalLegionLabel = this.allCards.getCard(CardIds.EternalLegionEnchantment).name;

	forceTooltipHidden = false;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly controller: BgsSimulatorControllerService,
	) {}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	preventAppDrag(event: MouseEvent) {
		event.stopPropagation();
		this.forceTooltipHidden = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	// CdkDragDrop<number>
	drop(event: any) {
		const movedElement: Entity = event.item.data;
		const movedElementNewIndex = event.container.data;
		const entitiesWithoutMovedElement: Entity[] = this.entities.filter((entity) => entity.id !== movedElement.id);
		entitiesWithoutMovedElement.splice(movedElementNewIndex, 0, movedElement);
		this.entities = entitiesWithoutMovedElement;
		this.controller.updateBoard(this.side, this.entities);
		this.forceTooltipHidden = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	// onUndeadArmyChanged(value: number) {
	// 	this.controller.requestUndeadArmyChange(value);
	// }

	// onEternalLegionChanged(value: number) {
	// 	this.controller.requestEternalLegionChange(value);
	// }

	addMinion() {
		console.debug('requesting add minion', this.side);
		this.controller.requestAddMinion(this.side);
	}

	updateMinion(entity: Entity, index: number) {
		this.controller.requestUpdateMinion(this.side, index);
	}

	removeMinion(entity: Entity, index: number) {
		this.controller.requestRemoveMinion(this.side, index);
	}

	addTeammate() {
		this.controller.addTeammate(this.side);
		console.debug('teammateShownInfo', this.teammateShownInfo, this._teammate);
	}

	removeTeammate() {
		this.controller.removeTeammate(this.side);
		console.debug('teammateShownInfo', this.teammateShownInfo, this._teammate);
	}

	switchTeammates() {
		this.controller.switchTeammates(this.side);
		this.updateInfo();
	}

	private updateInfo() {
		if (!this._player) {
			return;
		}

		this.heroCardId = this._player.player?.cardId;
		this.heroPowerCardId =
			this._player.player?.trinkets?.find((t) => t.scriptDataNum6 === TrinketSlot.HERO_POWER)?.cardId ??
			this._player.player?.heroPowerId;
		this.questRewardCardId = !!this._player.player?.questRewards?.length
			? this._player.player?.questRewards[0]
			: null;
		this.lesserTrinketCardId = this._player.player?.trinkets?.find(
			(trinket) => trinket.scriptDataNum6 === TrinketSlot.LESSER,
		)?.cardId;
		this.greaterTrinketCardId = this._player.player?.trinkets?.find(
			(trinket) => trinket.scriptDataNum6 === TrinketSlot.GREATER,
		)?.cardId;
		console.debug('trinkets', this._player.player?.trinkets, this.lesserTrinketCardId, this.greaterTrinketCardId);
		this.health = this._player.player.hpLeft;
		this.maxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this._player.player?.cardId, this.allCards);
		this.tavernTier = this._player.player.tavernTier;
		this.undeadArmy = this._player.player?.globalInfo?.UndeadAttackBonus ?? 0;
		// this.bloodGemAttackBonus = this._player.player?.globalInfo?.BloodGemAttackBonus ?? 0;
		// this.bloodGemHealthBonus = this._player.player?.globalInfo?.BloodGemHealthBonus ?? 0;
		// this.frostlingBonus = this._player.player?.globalInfo?.FrostlingBonus ?? 0;
		this.eternalLegion = this._player.player?.globalInfo?.EternalKnightsDeadThisGame ?? 0;
		this.tavernSpellsCastThisGame = this._player.player?.globalInfo?.TavernSpellsCastThisGame ?? 0;
		this.piratesPlayedThisGame = this._player.player?.globalInfo?.PiratesPlayedThisGame ?? 0;
		this.piratesSummonedThisGame = this._player.player?.globalInfo?.PiratesSummonedThisGame ?? 0;
		this.beastsSummonedThisGame = this._player.player?.globalInfo?.BeastsSummonedThisGame ?? 0;
		this.magnetizedThisGame = this._player.player?.globalInfo?.MagnetizedThisGame ?? 0;

		this.entities = (this._player.board ?? []).map((minion) => buildEntityFromBoardEntity(minion, this.allCards));

		this.teammateShownInfo = this.toBgsPlayer(this._teammate);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private toBgsPlayer(player: BgsBoardInfo | null): BgsPlayer | null {
		if (!player) {
			return null;
		}

		const result: BgsPlayer = BgsPlayer.create({
			cardId: player.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
			displayedCardId: player.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
			heroPowerCardId: player.player.heroPowerId ?? undefined,
			initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, player.player.cardId, this.allCards),
			questRewards: [], // TODO
			boardHistory: [this.toBgsBoard(player.board)].filter((b) => !!b) as BgsBoard[],
			lesserTrinket: player.player.trinkets?.find((t) => t.scriptDataNum6 === TrinketSlot.LESSER)?.cardId,
			greaterTrinket: player.player.trinkets?.find((t) => t.scriptDataNum6 === TrinketSlot.GREATER)?.cardId,
		});
		return result;
	}

	private toBgsBoard(board: BoardEntity[]): BgsBoard | null {
		if (!board?.length) {
			return null;
		}

		const result: BgsBoard = {
			turn: 0,
			board: board.map((entity) => buildEntityFromBoardEntity(entity, this.allCards)),
		};
		return result;
	}
}

export interface ChangeMinionRequest {
	// entity: Entity;
	index: number;
}
