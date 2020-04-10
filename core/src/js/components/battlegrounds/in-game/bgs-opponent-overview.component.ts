import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';
import { OpponentInfo } from './opponent-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-opponent-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview.component.scss`,
	],
	template: `
		<div class="opponent-overview">
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[icon]="_opponentInfo.icon"
					[health]="_opponentInfo.health"
					[maxHealth]="_opponentInfo.maxHealth"
					[cardTooltip]="_opponentInfo.heroPowerCardId"
					[cardTooltipText]="_opponentInfo.name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
				<!-- <div class="name">{{ _opponentInfo.name }}</div> -->
				<tavern-level-icon [level]="_opponentInfo.tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="_opponentInfo.boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="_opponentInfo.boardTurn"
					[tooltipPosition]="'top'"
				></bgs-board>
			</div>
			<div class="triples-section">
				<div class="title" *ngIf="tierTriples?.length">New triples</div>
				<div class="triple-tiers" *ngIf="tierTriples?.length">
					<div
						*ngFor="let triple of tierTriples; trackBy: trackByTripleFn"
						class="triple"
						[helpTooltip]="
							'That player got ' +
							triple.quantity +
							' tier ' +
							triple.minionTier +
							' minions since last time you fought them'
						"
					>
						<div class="number">x{{ triple.quantity }}</div>
						<tavern-level-icon [level]="triple.minionTier" class="tavern"></tavern-level-icon>
					</div>
				</div>
				<div class="subtitle" *ngIf="!tierTriples?.length">No new triple since the last encounter</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent {
	tierTriples: { minionTier: number; quantity: number }[];
	_opponentInfo: OpponentInfo;

	@Input() currentTurn: number;

	@Input() set opponentInfo(value: OpponentInfo) {
		this._opponentInfo = value;
		const triplesSinceLastBoard = value.triples.filter(triple => triple.turn >= value.boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));
		setTimeout(() => {
			console.log('will resize after setting opponent info');
			this.onResize();
		}, 300);
	}

	private previousBoardWidth: number;

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	ngAfterViewInit() {
		setTimeout(() => {
			this.onResize();
		}, 100);
		// Using HostListener bugs when moving back and forth between the tabs (maybe there is an
		// issue when destroying / recreating the view?)
		window.addEventListener('resize', () => {
			console.log('detected window resize');
			this.onResize();
		});
	}

	onResize() {
		console.log('on window resize');
		const boardContainer = this.el.nativeElement.querySelector('.board');
		if (!boardContainer) {
			return;
		}
		const rect = boardContainer.getBoundingClientRect();
		if (this.previousBoardWidth === rect.width) {
			return;
		}
		console.log('keeping the resize loop', this.previousBoardWidth, rect.width, rect);
		this.previousBoardWidth = rect.width;
		// console.log('boardContainer', boardContainer, rect);
		// const constrainedByWidth = rect.width <
		const cardElements = boardContainer.querySelectorAll('li');
		// 	console.log('cardElements', cardElements);
		let cardWidth = rect.width / 8;
		let cardHeight = 1.48 * cardWidth;
		// if (i === 0) {
		// 	console.log('first card width', cardWidth, cardHeight, rect.height);
		// }
		if (cardHeight > rect.height) {
			cardHeight = rect.height;
			cardWidth = cardHeight / 1.48;
		}
		// if (i === 0) {
		// 	console.log('card width', cardWidth, cardHeight);
		// }
		for (const cardElement of cardElements) {
			this.renderer.setStyle(cardElement, 'width', cardWidth + 'px');
			this.renderer.setStyle(cardElement, 'height', cardHeight + 'px');
		}
		setTimeout(() => this.onResize(), 200);
	}

	trackByTripleFn(index, item: { minionTier: number; quantity: number }) {
		return item.minionTier;
	}
}
