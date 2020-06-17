import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	ViewRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<perfect-scrollbar class="deck-list" (scroll)="onScroll($event)" [ngClass]="{ 'active': isScroll }">
			<ng-container [ngSwitch]="displayMode">
				<div class="list-background">/</div>
				<deck-list-by-zone
					*ngSwitchCase="'DISPLAY_MODE_ZONE'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showGiftsSeparately]="showGiftsSeparately"
					[tooltipPosition]="_tooltipPosition"
					[side]="side"
				>
				</deck-list-by-zone>
				<grouped-deck-list
					*ngSwitchCase="'DISPLAY_MODE_GROUPED'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showGiftsSeparately]="showGiftsSeparately"
					[cardsGoToBottom]="cardsGoToBottom"
					[darkenUsedCards]="darkenUsedCards"
					[tooltipPosition]="_tooltipPosition"
					[side]="side"
				>
				</grouped-deck-list>
			</ng-container>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent implements AfterViewInit, OnDestroy {
	@Input() displayMode: string;
	@Input() colorManaCost: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() cardsGoToBottom: boolean;
	@Input() darkenUsedCards: boolean;
	@Input() side: 'player' | 'opponent';

	_tooltipPosition: CardTooltipPositionType;
	_deckState: DeckState;
	isScroll: boolean;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[decktracker-deck-list] setting tooltip position', value);
		this._tooltipPosition = value;
	}

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
		this.refreshScroll();
	}

	private preferencesSubscription: Subscription;

	constructor(
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
		private events: Events,
		@Optional() private ow: OverwolfService,
	) {}

	ngAfterViewInit() {
		if (this.ow) {
			const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
			this.preferencesSubscription =
				preferencesEventBus &&
				preferencesEventBus.subscribe(event => {
					this.refreshScroll();
				});
		}
	}

	ngOnDestroy() {
		this.preferencesSubscription && this.preferencesSubscription.unsubscribe();
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private refreshScroll() {
		setTimeout(() => {
			const contentHeight = this.el.nativeElement.querySelector('.ps-content').getBoundingClientRect().height;
			const containerHeight = this.el.nativeElement.querySelector('.ps').getBoundingClientRect().height;
			this.isScroll = contentHeight > containerHeight;
			// console.log('isScroll', this.isScroll, containerHeight, contentHeight);
			this.refresh();
		}, 1000);
	}
}
