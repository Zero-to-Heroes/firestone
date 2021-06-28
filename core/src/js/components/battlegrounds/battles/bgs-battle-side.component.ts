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
		`../../../../css/component/battlegrounds/battles/bgs-battle-side.component.scss`,
	],
	template: `
		<div class="bgs-battle-side">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait"
					[icon]="icon"
					[health]="health"
					[maxHealth]="maxHealth"
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
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleSideComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Output() entitiesUpdated: EventEmitter<readonly Entity[]> = new EventEmitter<readonly Entity[]>();

	@Input() set player(value: BgsBoardInfo) {
		this._player = value;
		console.debug('setting player battle side', value);
		this.updateInfo();
	}

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
		entitiesWithoutMovedElement.splice(movedElementNewIndex, 0, movedElement);
		this.entities = entitiesWithoutMovedElement;
		this.entitiesUpdated.next(this.entities);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		if (!this._player) {
			return;
		}

		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${this._player.player?.cardId}.png`;
		this.health = this._player.player.hpLeft;
		this.maxHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, this._player.player?.cardId);
		this.tavernTier = this._player.player.tavernTier;

		this.entities = this._player.board.map((minion) =>
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
				},
				// This probably won't work with positioning auras, but I don't think there are many
				// left (used to have Dire Wolf Alpha)
				enchantments: minion.enchantments,
			} as any),
		);
		//console.debug('built entities', this.entities, this._player.board);
	}
}
