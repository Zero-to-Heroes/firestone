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
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
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
		<div class="bgs-battle-side">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait"
					[ngClass]="{ 'click-to-change': clickToChange }"
					[icon]="icon"
					[health]="health"
					[maxHealth]="maxHealth"
					(click)="onPortraitClick()"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
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
					(exClick)="clickMinion(entity, i)"
					(exDoubleClick)="doubleClickMinion(entity, i)"
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
					<button class="close" (click)="removeMinion(entity, i)" *ngIf="closeOnMinion">
						<svg class="svg-icon-fill">
							<use
								xmlns:xlink="https://www.w3.org/1999/xlink"
								xlink:href="assets/svg/sprite.svg#window-control_close"
							></use>
						</svg>
					</button>
				</div>
				<div
					class="click-to-add"
					*ngIf="((entities && entities.length) || 0) < 7 && allowClickToAdd"
					(click)="onClickToAdd()"
				>
					Click to add
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleSideComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Output() entitiesUpdated: EventEmitter<readonly Entity[]> = new EventEmitter<readonly Entity[]>();
	@Output() portraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() changeMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() updateMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() removeMinionRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();

	@Input() set player(value: BgsBoardInfo) {
		this._player = value;
		console.debug('setting player battle side', value);
		this.updateInfo();
	}

	@Input() allowClickToAdd: boolean;
	@Input() clickToChange = false;
	@Input() closeOnMinion = false;

	_player: BgsBoardInfo;

	icon: string;
	health: number;
	maxHealth: number;
	tavernTier: number;

	entities: readonly Entity[];

	constructor(private readonly cdr: ChangeDetectorRef, private readonly allCards: AllCardsService) {}

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

	onClickToAdd() {
		console.debug('adding', this.allowClickToAdd);
		this.changeMinionRequested.next(null);
	}

	clickMinion(entity: Entity, index: number) {
		this.changeMinionRequested.next({
			entity: entity,
			index: index,
		});
	}

	doubleClickMinion(entity: Entity, index: number) {
		console.debug('double clicked', entity);
		this.updateMinionRequested.next({
			entity: entity,
			index: index,
		});
	}

	removeMinion(entity: Entity, index: number) {
		console.debug('clicked', entity);
		this.removeMinionRequested.next({
			entity: entity,
			index: index,
		});
	}

	private updateInfo() {
		if (!this._player) {
			return;
		}

		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${this._player.player?.cardId}.png?v=2`;
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
	entity: Entity;
	index: number;
}
