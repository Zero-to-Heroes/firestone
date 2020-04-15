import { ComponentType } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsCardTooltipComponent } from './bgs-card-tooltip.component';

@Component({
	selector: 'bgs-board',
	styleUrls: [`../../../css/component/battlegrounds/bgs-board.component.scss`],
	template: `
		<div class="board-turn" *ngIf="_entities">
			Board as seen
			{{ currentTurn - boardTurn === 0 ? 'just now' : currentTurn - boardTurn + ' turns ago' }}
		</div>
		<div class="board-turn empty" *ngIf="!_entities">
			You have not fought that player yet
		</div>
		<div class="board-turn empty" *ngIf="_entities && _entities.length === 0">
			Last board was empty
		</div>
		<ul class="board" *ngIf="_entities?.length">
			<li
				*ngFor="let entity of _entities; trackBy: trackByFn"
				cachedComponentTooltip
				[componentType]="componentType"
				[componentInput]="entity"
				[componentTooltipPosition]="tooltipPosition"
			>
				<card-on-board
					transition-group-item
					[entity]="entity"
					[enchantments]="buildEnchantments(entity)"
					[option]="isOption(entity)"
					[isMainPlayer]="isMainPlayer"
					[isRecruitPhase]="isRecruitPhase"
				>
				</card-on-board>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardComponent implements AfterViewInit {
	_entities: readonly Entity[] = [];
	_enchantmentCandidates: readonly Entity[];
	_options: readonly number[];
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() isMainPlayer: boolean;
	@Input() debug: boolean;
	@Input() isRecruitPhase: boolean;
	@Input() currentTurn: number;
	@Input() boardTurn: number;
	@Input() tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'right';

	@Input('entities') set entities(entities: readonly Entity[]) {
		// console.log(
		// 	'setting new entities',
		// 	entities == this._entities,
		// 	rdiff.getDiff(entities, this._entities, true),
		// 	this._entities,
		// 	entities,
		// );
		// That's a big hack, and it looks like I have to do it for all changing arrays (!).
		// Otherwise, there is an issue when removing all items from the first list then adding another:
		// - in core.js DefaultIterableDiffer.prototype.forEachOperation, the adjPreviousIndex gets negative for the
		// first item to add in the new list (all the other parameters stay at 0)
		// - in common.js, this causes NgForOf.prototype._applyChanges to try and get a view with a negative index
		// Resetting the view first seems to do the trick. This is fine since we almost never capitalize on the
		// fact that items that move around are kept alive in these cases
		this._entities = !entities ? undefined : [];
		setTimeout(() => {
			this._entities = entities;
			this.previousBoardWidth = undefined;
			this.onResize();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@Input('enchantmentCandidates') set enchantmentCandidates(value: readonly Entity[]) {
		// this.logger.debug('[board] setting enchantmentCandidates', value);
		this._enchantmentCandidates = value;
	}

	@Input('options') set options(value: readonly number[]) {
		// this.logger.debug('[board] setting options', value);
		this._options = value;
	}

	private previousBoardWidth: number;
	// private previousNumberOfEntities: number;

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly cdr: ChangeDetectorRef,
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

	onResize() {
		// return;
		// console.log('on window resize');
		const boardContainer = this.el.nativeElement.querySelector('.board');
		if (!boardContainer) {
			if (this._entities?.length) {
				// if (this.debug) {
				// 	console.log('no  board container, retrying', this.el.nativeElement);
				// }
				setTimeout(() => this.onResize(), 300);
				return;
			}
			return;
		}
		const rect = boardContainer.getBoundingClientRect();
		// We have to resize even though we have the same number of entities, because the resize is
		// set on the DOM elements, which are teared down and recreated
		if (this.previousBoardWidth === rect.width) {
			return;
		}
		this.previousBoardWidth = rect.width;
		const cardElements: any[] = boardContainer.querySelectorAll('li');
		if (cardElements.length !== this._entities?.length) {
			setTimeout(() => this.onResize(), 300);
			return;
		}
		let cardWidth = rect.width / 8;
		let cardHeight = 1.48 * cardWidth;
		if (cardHeight > rect.height) {
			cardHeight = rect.height;
			cardWidth = cardHeight / 1.48;
		}
		for (const cardElement of cardElements) {
			this.renderer.setStyle(cardElement, 'width', cardWidth + 'px');
			this.renderer.setStyle(cardElement, 'height', cardHeight + 'px');
		}
		// Continue resizing until the board size has stabilized
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
