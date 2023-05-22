import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import { GameFormat } from '@firestone-hs/reference-data';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { explodeDecklist, normalizeWithDbfIds } from '../../../services/decktracker/deck-parser.service';

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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDecktrackerOocComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	deckstring$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.deckstring$ = this.store
			.listen$(([main, nav]) => main.duels.currentDuelsDeck)
			.pipe(
				filter(([deck]) => !!deck),
				this.mapData(([deck]) => {
					const cardIds = deck.DeckList as readonly string[];
					const deckDefinition: DeckDefinition = {
						format: GameFormat.FT_WILD,
						cards: Object.values(groupByFunction((cardId: string) => cardId)(cardIds)).map((cardIds) => [
							this.allCards.getCard(cardIds[0]).dbfId,
							cardIds.length,
						]),
						heroes: [this.allCards.getCard(deck.HeroCardId).dbfId],
						sideboards: !deck.Sideboards?.length
							? null
							: deck.Sideboards.map((sideboard) => {
									return {
										keyCardDbfId: this.allCards.getCard(sideboard.KeyCardId).dbfId,
										cards: explodeDecklist(normalizeWithDbfIds(sideboard.Cards, this.allCards)),
									};
							  }),
					};
					console.debug('[duels-decktracker-ooc] encoding', deckDefinition, deck);
					return encode(deckDefinition);
				}),
			);
		this.cardsHighlight.initForDuels();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		// this.cardsHighlight.shutDown();
	}
}
