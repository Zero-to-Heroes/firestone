import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { Events } from '../../../services/events.service';

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<perfect-scrollbar class="deck-list" (scroll)="onScroll($event)">
			<ng-container [ngSwitch]="displayMode">
				<deck-list-by-zone
					*ngSwitchCase="'DISPLAY_MODE_ZONE'"
					[deckState]="_deckState"
					[tooltipPosition]="_tooltipPosition"
				>
				</deck-list-by-zone>
				<grouped-deck-list
					*ngSwitchCase="'DISPLAY_MODE_GROUPED'"
					[deckState]="_deckState"
					[highlightCardsInHand]="highlightCardsInHand"
					[tooltipPosition]="_tooltipPosition"
				>
				</grouped-deck-list>
			</ng-container>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent implements AfterViewInit {
	@Input() displayMode: string;
	@Input() highlightCardsInHand: boolean;

	_tooltipPosition: CardTooltipPositionType;
	_deckState: DeckState;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[decktracker-deck-list] setting tooltip position', value);
		this._tooltipPosition = value;
	}

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef, private events: Events) {}

	ngAfterViewInit() {
		const singleEl: HTMLElement = this.el.nativeElement.querySelector('.single');
		const caretEl = singleEl.appendChild(document.createElement('i'));
		caretEl.innerHTML = `<svg class="svg-icon-fill">
				<use xlink:href="assets/svg/sprite.svg#arrow"/>
			</svg>`;
		caretEl.classList.add('i-30');
		caretEl.classList.add('caret');
		setTimeout(() => {
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const rect = this.el.nativeElement.querySelector('.deck-list').getBoundingClientRect();
		// console.log('element rect', r ect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	onScroll(event) {
		// console.log('scrolling');
		// Force immediate clean of the tooltip
		this.events.broadcast(Events.DECK_HIDE_TOOLTIP, 0);
	}

	refresh() {
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
