import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { SetCard } from '../../../models/set';
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
				<div class="list-background"></div>
				<deck-list-by-zone
					*ngSwitchCase="'DISPLAY_MODE_ZONE'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showUpdatedCost]="showUpdatedCost"
					[showGlobalEffectsZone]="showGlobalEffectsZone"
					[showGiftsSeparately]="showGiftsSeparately"
					[showStatsChange]="showStatsChange"
					[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone"
					[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone"
					[tooltipPosition]="_tooltipPosition"
					[side]="side"
				>
				</deck-list-by-zone>
				<grouped-deck-list
					*ngSwitchCase="'DISPLAY_MODE_GROUPED'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showUpdatedCost]="showUpdatedCost"
					[showGiftsSeparately]="showGiftsSeparately"
					[showStatsChange]="showStatsChange"
					[cardsGoToBottom]="cardsGoToBottom"
					[darkenUsedCards]="darkenUsedCards"
					[tooltipPosition]="_tooltipPosition"
					[collection]="collection"
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
	@Input() showUpdatedCost: boolean;
	@Input() showGlobalEffectsZone: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() showStatsChange: boolean;
	@Input() cardsGoToBottom: boolean;
	@Input() darkenUsedCards: boolean;
	@Input() hideGeneratedCardsInOtherZone: boolean;
	@Input() sortCardsByManaCostInOtherZone: boolean;
	@Input() side: 'player' | 'opponent';
	@Input() collection: readonly SetCard[];

	_tooltipPosition: CardTooltipPositionType;
	_deckState: DeckState;
	isScroll: boolean;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
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
		if (this.ow?.isOwEnabled()) {
			const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
			this.preferencesSubscription =
				preferencesEventBus &&
				preferencesEventBus.subscribe((event) => {
					this.refreshScroll();
				});
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription && this.preferencesSubscription.unsubscribe();
		this._deckState = null;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const rect = this.el.nativeElement.querySelector('.deck-list').getBoundingClientRect();

		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	onScroll(event) {
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
			const psContent = this.el.nativeElement.querySelector('.ps-content');
			const ps = this.el.nativeElement.querySelector('.ps');
			if (!ps || !psContent) {
				return;
			}
			const contentHeight = psContent.getBoundingClientRect().height;
			const containerHeight = ps.getBoundingClientRect().height;
			this.isScroll = contentHeight > containerHeight;

			this.refresh();
		}, 1000);
	}
}
