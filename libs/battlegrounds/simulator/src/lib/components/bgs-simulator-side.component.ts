import { ComponentType } from '@angular/cdk/portal';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { CardIds, GameType, defaultStartingHp } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsBoard, BgsCardTooltipComponent, BgsPlayer } from '@firestone/battlegrounds/common';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { buildEntityFromBoardEntity } from '../services/simulation-utils';

@Component({
	selector: 'bgs-simulator-side',
	styleUrls: [`./bgs-simulator-side.component.scss`],
	template: `
		<div class="bgs-battle-side full-screen-mode">
			<div class="add-teammate" *ngIf="!_teammate && enableDuos">
				<div class="add-teammate-button" (click)="addTeammate()">
					<div class="add-teammate-icon">+</div>
					<div class="add-teammate-text">Add teammate</div>
				</div>
			</div>
			<div class="teammate-recap" *ngIf="!!_teammate && enableDuos">
				<bgs-simulator-player-overview
					class="teammate-container"
					[opponent]="teammateShownInfo"
					[showBoardMessage]="!teammateShownInfo?.boardHistory?.length"
					[emptyBoardMessage]="
						'No board yet. Click to switch the teammate to the active spot, and edit the board there.'
					"
				></bgs-simulator-player-overview>
			</div>
			<div class="hero">
				<bgs-hero-portrait-simulator
					class="portrait"
					[heroCardId]="heroCardId"
					[heroPowerCardId]="heroPowerCardId"
					[questRewardCardId]="questRewardCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[tavernTier]="showTavernTier ? tavernTier : null"
					[tooltipPosition]="tooltipPosition"
					[fullScreenMode]="fullScreenMode"
					(portraitChangeRequested)="onPortraitClick()"
					(heroPowerChangeRequested)="onHeroPowerClick()"
					(questRewardChangeRequested)="onQuestRewardClick()"
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
					cachedComponentTooltip
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
					<bgs-plus-button
						class="button update"
						[useUpdateIcon]="true"
						(click)="updateMinion(entity, i)"
						*ngIf="closeOnMinion"
						[helpTooltip]="'battlegrounds.sim.update-minion-button-tooltip' | fsTranslate"
					></bgs-plus-button>
					<bgs-minus-button
						class="button remove"
						(click)="removeMinion(entity, i)"
						*ngIf="closeOnMinion"
						helpTooltip="Remove minion"
						[helpTooltip]="'battlegrounds.sim.remove-minion-button-tooltip' | fsTranslate"
					></bgs-minus-button>
				</div>
				<div class="click-to-add" *ngIf="((entities && entities.length) || 0) < 7 && allowClickToAdd">
					<bgs-plus-button
						class="change-icon"
						(click)="addMinion()"
						[helpTooltip]="'battlegrounds.sim.add-minion-button-tooltip' | fsTranslate"
					></bgs-plus-button>
					<div class="empty-minion" inlineSVG="assets/svg/bg_empty_minion.svg"></div>
				</div>
			</div>
			<div class="switch-teammate-container" *ngIf="!!_teammate && enableDuos">
				<div
					class="switch-teammate-button"
					[inlineSVG]="'assets/svg/restore.svg'"
					(click)="switchTeammates()"
				></div>
			</div>
			<!-- TODO: move this -->
			<div class="global-effects">
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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorSideComponent {
	enableDuos = false;

	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Output() addMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() updateMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() removeMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() entitiesUpdated: EventEmitter<readonly Entity[]> = new EventEmitter<readonly Entity[]>();
	@Output() portraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() heroPowerChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() questRewardChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() eternalLegionChanged = new EventEmitter<number>();
	@Output() undeadArmyChanged = new EventEmitter<number>();

	@Input() set player(value: BgsBoardInfo) {
		this._player = value;
		this.updateInfo();
	}

	@Input() set teammate(value: BgsBoardInfo) {
		this._teammate = value;
		this.teammateShownInfo = this.toBgsPlayer(this._teammate);
		this.updateInfo();
	}

	@Input() allowClickToAdd: boolean;
	@Input() clickToChange = false;
	@Input() closeOnMinion = false;
	@Input() showTavernTier = false;
	@Input() fullScreenMode = false;
	@Input() tooltipPosition: CardTooltipPositionType;

	_player: BgsBoardInfo;
	_teammate: BgsBoardInfo;

	teammateShownInfo: BgsPlayer | null;

	heroCardId: string;
	heroPowerCardId: string | null | undefined;
	questRewardCardId: string | null | undefined;
	health: number;
	maxHealth: number;
	tavernTier: number;
	undeadArmy: number;
	eternalLegion: number;
	tavernSpellsCastThisGame: number;
	piratesPlayedThisGame: number;
	forceTooltipHidden = false;

	entities: readonly Entity[];

	undeadArmyLabel = this.allCards.getCard(CardIds.NerubianDeathswarmer_UndeadArmyEnchantment).name;
	eternalLegionLabel = this.allCards.getCard(CardIds.EternalLegionEnchantment).name;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly allCards: CardsFacadeService) {}

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
		this.entitiesUpdated.next(this.entities);
		this.forceTooltipHidden = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPortraitClick() {
		this.portraitChangeRequested.next();
	}

	onHeroPowerClick() {
		this.heroPowerChangeRequested.next();
	}

	onQuestRewardClick() {
		this.questRewardChangeRequested.next();
	}

	onUndeadArmyChanged(value: number) {
		this.undeadArmyChanged.next(value);
	}

	onEternalLegionChanged(value: number) {
		this.eternalLegionChanged.next(value);
	}

	addMinion() {
		this.addMinionRequested.next({ index: this.entities.length });
	}

	updateMinion(entity: Entity, index: number) {
		this.updateMinionRequested.next({
			index: index,
		});
	}

	removeMinion(entity: Entity, index: number) {
		this.removeMinionRequested.next({
			index: index,
		});
	}

	addTeammate() {
		this._teammate = {
			board: [],
			player: {
				cardId: CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
				heroPowerId: null,
				hpLeft: 30,
				tavernTier: this._player?.player?.tavernTier ?? 1,
				globalInfo: {},
				questEntities: [],
				friendly: this._player.player.friendly,
				hand: [],
				heroPowerUsed: false,
			},
			secrets: [],
		};
		this.teammateShownInfo = this.toBgsPlayer(this._teammate);
		console.debug('teammateShownInfo', this.teammateShownInfo, this._teammate);
	}

	switchTeammates() {
		const tmp = this._player;
		this._player = this._teammate;
		this._teammate = tmp;
		this.updateInfo();
	}

	private updateInfo() {
		if (!this._player) {
			return;
		}

		this.heroCardId = this._player.player?.cardId;
		this.heroPowerCardId = this._player.player?.heroPowerId;
		this.questRewardCardId = !!this._player.player?.questRewards?.length
			? this._player.player?.questRewards[0]
			: null;
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

		this.entities = (this._player.board ?? []).map((minion) => buildEntityFromBoardEntity(minion, this.allCards));

		this.teammateShownInfo = this.toBgsPlayer(this._teammate);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private toBgsPlayer(player: BgsBoardInfo): BgsPlayer | null {
		if (!player) {
			return null;
		}

		const result: BgsPlayer = BgsPlayer.create({
			cardId: player.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
			displayedCardId: player.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
			heroPowerCardId: player.player.heroPowerId,
			initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, player.player.cardId, this.allCards),
			questRewards: [], // TODO
			boardHistory: [this.toBgsBoard(player.board)].filter((b) => !!b),
		} as any);
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
