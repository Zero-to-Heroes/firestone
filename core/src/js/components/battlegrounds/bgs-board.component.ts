import { ComponentType } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';
import { MinionStat } from '../../models/battlegrounds/post-match/minion-stat';
import { BgsCardTooltipComponent } from './bgs-card-tooltip.component';
import { normalizeCardId } from './post-match/card-utils';

@Component({
	selector: 'bgs-board',
	styleUrls: [`../../../css/component/battlegrounds/bgs-board.component.scss`],
	template: `
		<div class="board-turn" *ngIf="_entities && !finalBoard">
			Board as seen
			{{ currentTurn - boardTurn === 0 ? 'just now' : currentTurn - boardTurn + ' turns ago' }}
		</div>
		<div class="board-turn" *ngIf="_entities && finalBoard">
			Your final board
		</div>
		<div class="board-turn empty" *ngIf="!_entities">
			You have not fought that player yet
		</div>
		<div class="board-turn empty" *ngIf="_entities && _entities.length === 0">
			Last board was empty
		</div>
		<ul class="board" *ngIf="_entities && _entities.length > 0" [style.opacity]="boardReady ? 1 : 0">
			<div class="minion-container" *ngFor="let entity of _entities || []; trackBy: trackByFn">
				<li>
					<card-on-board
						transition-group-item
						[entity]="entity"
						[enchantments]="buildEnchantments(entity)"
						[option]="isOption(entity)"
						[isMainPlayer]="isMainPlayer"
						[isRecruitPhase]="isRecruitPhase"
						cachedComponentTooltip
						[componentType]="componentType"
						[componentInput]="entity"
						[componentTooltipPosition]="tooltipPosition"
					>
					</card-on-board>
				</li>
				<div class="minion-stats" *ngIf="_minionStats && _minionStats.length > 0">
					<div
						class="header"
						[helpTooltip]="
							showTooltipWarning(entity)
								? 'Multiple distinct minions, as well as golden minions, share the same stats (because of how Battlegrounds is coded)'
								: null
						"
					>
						Total Dmg <span *ngIf="showTooltipWarning(entity)">*</span>
					</div>
					<div class="values">
						<div class="damage-dealt">{{ getDamageDealt(entity) }}</div>
						<div class="damage-taken">{{ getDamageTaken(entity) }}</div>
					</div>
				</div>
			</div>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardComponent implements AfterViewInit {
	_entities: readonly Entity[];
	_enchantmentCandidates: readonly Entity[];
	_options: readonly number[];
	_minionStats: readonly MinionStat[];
	boardReady: boolean;
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() isMainPlayer: boolean;
	@Input() debug: boolean;
	@Input() isRecruitPhase: boolean;
	@Input() currentTurn: number;
	@Input() boardTurn: number;
	@Input() finalBoard: boolean;
	@Input() tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'right';
	@Input() maxBoardHeight = 1;

	@Input() set minionStats(value: readonly MinionStat[]) {
		this._minionStats = value;
	}

	@Input('entities') set entities(entities: readonly Entity[]) {
		if (this.inputEntities === entities) {
			return;
		}
		this.inputEntities = entities;
		this._entities = entities?.map(entity => Entity.create({ ...entity } as Entity));
		this.previousBoardWidth = undefined;
		this.boardReady = false;
		// console.log('setting board ready', this.boardReady);
		this.onResize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input('enchantmentCandidates') set enchantmentCandidates(value: readonly Entity[]) {
		this._enchantmentCandidates = value;
	}

	@Input('options') set options(value: readonly number[]) {
		this._options = value;
	}

	private previousBoardWidth: number;
	private previousBoardHeight: number;
	private inputEntities: readonly Entity[];

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
	) {}

	ngAfterViewInit() {
		setTimeout(() => {
			this.onResize();
		}, 100);
		// Using HostListener bugs when moving back and forth between the tabs (maybe there is an
		// issue when destroying / recreating the view?)
		window.addEventListener('resize', () => {
			// console.log('detected window resize');
			this.onResize();
		});
	}

	showTooltipWarning(entity: Entity): boolean {
		return (
			this._entities
				.map(e => normalizeCardId(e.cardID, this.allCards))
				.filter(cardId => cardId === normalizeCardId(entity.cardID, this.allCards)).length > 1
		);
	}

	getDamageDealt(entity: Entity): number {
		return this._minionStats.find(stat => stat.cardId === normalizeCardId(entity.cardID, this.allCards))
			?.damageDealt;
	}

	getDamageTaken(entity: Entity): number {
		return this._minionStats.find(stat => stat.cardId === normalizeCardId(entity.cardID, this.allCards))
			?.damageTaken;
	}

	@HostListener('window:resize')
	onResize() {
		// console.log('on window resize');
		const boardContainer = this.el.nativeElement.querySelector('.board');
		if (!boardContainer) {
			if (this._entities?.length) {
				if (this.debug) {
					console.log('no  board container, retrying', this.el.nativeElement);
				}
				setTimeout(() => this.onResize(), 300);
				return;
			}
			return;
		}
		const rect = boardContainer.getBoundingClientRect();
		if (this.debug) {
			console.log('board container', boardContainer, rect);
		}
		if (!rect.width || !rect.height) {
			if (this.debug) {
				console.log('no dimensions, retrying');
			}
			setTimeout(() => this.onResize(), 1000);
			return;
		}
		const cardElements: any[] = boardContainer.querySelectorAll('li');
		if (cardElements.length !== (this._entities?.length || 0)) {
			if (this.debug) {
				console.log('card elements not displayed yet', cardElements, this._entities);
			}
			setTimeout(() => this.onResize(), 300);
			return;
		}
		// We have to resize even though we have the same number of entities, because the resize is
		// set on the DOM elements, which are teared down and recreated
		if (this.previousBoardWidth === rect.width && this.previousBoardHeight === rect.height) {
			if (this.debug) {
				console.log('all good, drawing cards', this.previousBoardWidth, rect);
			}
			// The board size is fixed, now we add the cards
			let cardWidth = (this.previousBoardWidth / 8) * 0.85; // take the margin into account
			let cardHeight = 1.48 * cardWidth;
			if (cardHeight > this.previousBoardHeight * this.maxBoardHeight) {
				if (this.debug) {
					console.log('cropping cards to height', cardHeight, this.previousBoardHeight, this.maxBoardHeight);
				}
				cardHeight = 0.85 * this.previousBoardHeight * this.maxBoardHeight;
				cardWidth = cardHeight / 1.48;
			}
			if (this.debug) {
				console.log('will set card dimensions', cardWidth, cardHeight);
			}
			for (const cardElement of cardElements) {
				this.renderer.setStyle(cardElement, 'width', cardWidth + 'px');
				this.renderer.setStyle(cardElement, 'height', cardHeight + 'px');
			}
			this.boardReady = true;
			// console.log('setting board ready', this.boardReady);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		if (this.debug) {
			console.log('dimensions are changing', this.previousBoardWidth, this.previousBoardHeight, rect);
		}
		this.previousBoardWidth = rect.width;
		this.previousBoardHeight = rect.height;
		setTimeout(() => this.onResize(), 300);
	}

	isOption(entity: Entity): boolean {
		return this._options && this._options.indexOf(entity.id) !== -1;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	buildEnchantments(entity: Entity): readonly Entity[] {
		if (!this._enchantmentCandidates) {
			return [];
		}
		return this._enchantmentCandidates.filter(e => e.getTag(GameTag.ATTACHED) === entity.id);
	}
}
