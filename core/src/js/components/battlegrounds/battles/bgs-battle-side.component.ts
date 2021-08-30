import { CdkDragDrop } from '@angular/cdk/drag-drop';
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
import { GameTag, GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { CardsFacadeService } from '@services/cards-facade.service';
import { defaultStartingHp } from '../../../services/hs-utils';
import { BgsCardTooltipComponent } from '../bgs-card-tooltip.component';

@Component({
	selector: 'bgs-battle-side',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battle-side.component.scss`,
	],
	template: `
		<div class="bgs-battle-side" [ngClass]="{ 'full-screen-mode': fullScreenMode }">
			<div class="hero">
				<bgs-hero-portrait-simulator
					class="portrait"
					[heroCardId]="heroCardId"
					[heroPowerCardId]="heroPowerCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[tavernTier]="showTavernTier && tavernTier"
					[tooltipPosition]="tooltipPosition"
					(portraitChangeRequested)="onPortraitClick()"
					(heroPowerChangeRequested)="onHeroPowerClick()"
				></bgs-hero-portrait-simulator>
			</div>
			<div class="board" cdkDropListGroup (cdkDropListDropped)="drop($event)">
				<!-- See https://stackoverflow.com/questions/65726138/how-can-i-use-angular-material-drag-n-drop-with-flex-layout -->
				<div
					class="minion-container"
					*ngFor="let entity of entities; let i = index"
					cdkDropList
					cdkDropListOrientation="horizontal"
					[cdkDropListData]="i"
					(cdkDropListDropped)="drop($event)"
					cachedComponentTooltip
					[componentType]="componentType"
					[componentInput]="entity"
					[componentTooltipPosition]="'right'"
				>
					<card-on-board
						class="minion"
						[entity]="entity"
						[useSvg]="false"
						(mousedown)="preventAppDrag($event)"
						cdkDrag
						[cdkDragData]="entity"
						(cdkDropListDropped)="drop($event)"
					>
					</card-on-board>
					<bgs-plus-button
						class="button update"
						(click)="updateMinion(entity, i)"
						*ngIf="closeOnMinion"
						helpTooltip="Update minion"
					></bgs-plus-button>
					<bgs-minus-button
						class="button remove"
						(click)="removeMinion(entity, i)"
						*ngIf="closeOnMinion"
						helpTooltip="Remove minion"
					></bgs-minus-button>
				</div>
				<div class="click-to-add" *ngIf="((entities && entities.length) || 0) < 7 && allowClickToAdd">
					<bgs-plus-button
						class="change-icon"
						(click)="addMinion()"
						helpTooltip="Click to add a minion"
					></bgs-plus-button>
					<div class="empty-minion" inlineSVG="assets/svg/bg_empty_minion.svg"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleSideComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Output() addMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() updateMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() removeMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() entitiesUpdated: EventEmitter<readonly Entity[]> = new EventEmitter<readonly Entity[]>();
	@Output() portraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() heroPowerChangeRequested: EventEmitter<void> = new EventEmitter<void>();

	@Input() set player(value: BgsBoardInfo) {
		this._player = value;
		console.debug('setting player battle side', value);
		this.updateInfo();
	}

	@Input() allowClickToAdd: boolean;
	@Input() clickToChange = false;
	@Input() closeOnMinion = false;
	@Input() showTavernTier = true;
	@Input() fullScreenMode = false;
	@Input() tooltipPosition: string;

	_player: BgsBoardInfo;

	heroCardId: string;
	heroPowerCardId: string;
	health: number;
	maxHealth: number;
	tavernTier: number;

	entities: readonly Entity[];

	constructor(private readonly cdr: ChangeDetectorRef, private readonly allCards: CardsFacadeService) {}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	preventAppDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	drop(event: CdkDragDrop<number>) {
		const movedElement: Entity = event.item.data;
		const movedElementNewIndex = event.container.data;
		const entitiesWithoutMovedElement: Entity[] = this.entities.filter((entity) => entity.id !== movedElement.id);
		console.debug('preparing to drop', this.entities, entitiesWithoutMovedElement);
		entitiesWithoutMovedElement.splice(movedElementNewIndex, 0, movedElement);
		this.entities = entitiesWithoutMovedElement;
		console.debug(
			'entities',
			this.entities,
			movedElement,
			movedElementNewIndex,
			entitiesWithoutMovedElement,
			event,
		);
		this.entitiesUpdated.next(this.entities);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPortraitClick() {
		this.portraitChangeRequested.next();
	}

	onHeroPowerClick() {
		console.debug('hero power click');
		this.heroPowerChangeRequested.next();
	}

	addMinion() {
		console.debug('adding', this.allowClickToAdd);
		this.addMinionRequested.next(null);
	}

	updateMinion(entity: Entity, index: number) {
		console.debug('updating', entity);
		this.updateMinionRequested.next({
			// entity: entity,
			index: index,
		});
	}

	removeMinion(entity: Entity, index: number) {
		console.debug('clicked', entity);
		this.removeMinionRequested.next({
			index: index,
		});
	}

	private updateInfo() {
		if (!this._player) {
			return;
		}

		this.heroCardId = this._player.player?.cardId;
		this.heroPowerCardId = this._player.player?.heroPowerId;
		console.debug('heroCardId', this.heroCardId, this._player);
		this.health = this._player.player.hpLeft;
		this.maxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this._player.player?.cardId);
		this.tavernTier = this._player.player.tavernTier;

		this.entities = (this._player.board ?? []).map((minion) =>
			Entity.fromJS({
				id: minion.entityId,
				cardID: minion.cardId,
				damageForThisAction: 0,
				tags: {
					[GameTag[GameTag.ATK]]: minion.attack,
					[GameTag[GameTag.HEALTH]]: minion.health,
					[GameTag[GameTag.TAUNT]]: minion.taunt ? 1 : 0,
					[GameTag[GameTag.DIVINE_SHIELD]]: minion.divineShield ? 1 : 0,
					[GameTag[GameTag.POISONOUS]]: minion.poisonous ? 1 : 0,
					[GameTag[GameTag.REBORN]]: minion.reborn ? 1 : 0,
					[GameTag[GameTag.WINDFURY]]: minion.windfury || minion.megaWindfury ? 1 : 0,
					[GameTag[GameTag.MEGA_WINDFURY]]: minion.megaWindfury ? 1 : 0,
					[GameTag[GameTag.PREMIUM]]: this.allCards.getCard(minion.cardId)?.battlegroundsNormalDbfId ? 1 : 0,
				},
				// This probably won't work with positioning auras, but I don't think there are many
				// left (used to have Dire Wolf Alpha)
				enchantments: minion.enchantments,
			} as any),
		);
		//console.debug('built entities', this.entities, this._player.board);
	}
}

export interface ChangeMinionRequest {
	// entity: Entity;
	index: number;
}
