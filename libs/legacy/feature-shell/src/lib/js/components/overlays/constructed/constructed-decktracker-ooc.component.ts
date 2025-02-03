import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { Observable, distinctUntilChanged, tap } from 'rxjs';
import { DeckParserFacadeService } from '../../../services/decktracker/deck-parser-facade.service';

@Component({
	selector: 'constructed-decktracker-ooc',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'./constructed-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<ng-container *ngIf="deckstring$ | async as deckstring">
				<div class="decktracker-container">
					<div class="decktracker" *ngIf="!!deckstring">
						<div class="background"></div>
						<deck-list-static class="played-cards" [deckstring]="deckstring"> </deck-list-static>
						<!-- <div class="backdrop" *ngIf="showBackdrop"></div> -->
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	deckstring$: Observable<string>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly deck: DeckParserFacadeService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.deck, this.prefs);

		this.deckstring$ = this.deck.currentDeck$$.pipe(
			tap((deck) => console.debug('[constructed-decktracker-ooc] new deck', deck)),
			distinctUntilChanged((a, b) => a?.deckstring === b?.deckstring),
			this.mapData((deck) => deck?.deckstring),
		);

		this.cardsHighlight.initForSingle();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
