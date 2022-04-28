import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	Output,
	ViewRef,
} from '@angular/core';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { SetCard } from '../../../models/set';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<perfect-scrollbar class="deck-list" [ngClass]="{ 'active': isScroll }" scrollable>
			<ng-container [ngSwitch]="displayMode">
				<div class="list-background"></div>
				<deck-list-by-zone
					*ngSwitchCase="'DISPLAY_MODE_ZONE'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showUnknownCards]="showUnknownCards"
					[showUpdatedCost]="showUpdatedCost"
					[showGlobalEffectsZone]="showGlobalEffectsZone"
					[showGiftsSeparately]="showGiftsSeparately"
					[showStatsChange]="showStatsChange"
					[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone"
					[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone"
					[showTopCardsSeparately]="showTopCardsSeparately"
					[showBottomCardsSeparately]="showBottomCardsSeparately"
					[tooltipPosition]="_tooltipPosition"
					[side]="side"
				>
				</deck-list-by-zone>
				<grouped-deck-list
					*ngSwitchCase="'DISPLAY_MODE_GROUPED'"
					[deckState]="_deckState"
					[colorManaCost]="colorManaCost"
					[showUnknownCards]="showUnknownCards"
					[showUpdatedCost]="showUpdatedCost"
					[showGiftsSeparately]="showGiftsSeparately"
					[showStatsChange]="showStatsChange"
					[cardsGoToBottom]="cardsGoToBottom"
					[darkenUsedCards]="darkenUsedCards"
					[tooltipPosition]="_tooltipPosition"
					[showTopCardsSeparately]="showTopCardsSeparately"
					[showBottomCardsSeparately]="showBottomCardsSeparately"
					[collection]="collection"
					[side]="side"
					(cardClicked)="onCardClicked($event)"
				>
				</grouped-deck-list>
			</ng-container>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() displayMode: string;
	@Input() colorManaCost: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showGlobalEffectsZone: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() showStatsChange: boolean;
	@Input() showUnknownCards: boolean;
	@Input() cardsGoToBottom: boolean;
	@Input() darkenUsedCards: boolean;
	@Input() hideGeneratedCardsInOtherZone: boolean;
	@Input() sortCardsByManaCostInOtherZone: boolean;
	@Input() showBottomCardsSeparately: boolean;
	@Input() showTopCardsSeparately: boolean;
	@Input() side: 'player' | 'opponent' | 'duels';
	@Input() collection: readonly SetCard[];
	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}
	@Input() set deckState(deckState: DeckState) {
		this._deckState = deckState;
		this.refreshScroll();
	}

	_tooltipPosition: CardTooltipPositionType;
	_deckState: DeckState;
	isScroll: boolean;

	private sub$$: Subscription;

	constructor(
		private el: ElementRef,
		@Optional() protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.sub$$ = this.store
			?.listenPrefs$((prefs) => prefs.decktrackerScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => this.refreshScroll());
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
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
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 1000);
	}
}
