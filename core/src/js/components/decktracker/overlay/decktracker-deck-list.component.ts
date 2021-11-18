import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Optional,
	ViewRef,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { SetCard } from '../../../models/set';
import { OverwolfService } from '../../../services/overwolf.service';
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
export class DeckTrackerDeckListComponent extends AbstractSubscriptionComponent implements AfterViewInit {
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

	constructor(
		private el: ElementRef,
		@Optional() private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterViewInit() {
		this.store
			.listenPrefs$((prefs) => prefs.secretsHelperScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				this.refreshScroll();
			});
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
