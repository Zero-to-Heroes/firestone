import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'duels-decktracker-ooc',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/overlays/duels-ooc/duels-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<ng-container *ngIf="cards$ | async as cards">
					<div class="decktracker-container">
						<div class="decktracker" *ngIf="!!cards">
							<div class="background"></div>
							<deck-list class="played-cards" [cards]="cards" [side]="'duels'"> </deck-list>
							<!-- <div class="backdrop" *ngIf="showBackdrop"></div> -->
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	// deck$: Observable<DeckState>;
	cards$: Observable<readonly string[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.cards$ = this.store
			.listen$(([main, nav]) => main.duels.currentDuelsDeck)
			.pipe(
				filter(([deck]) => !!deck),
				this.mapData(([deck]) => deck.DeckList as readonly string[]),
			);
		this.cardsHighlight.initForDuels();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		// this.cardsHighlight.shutDown();
	}
}
