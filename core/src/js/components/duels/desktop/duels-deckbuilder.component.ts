import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, from, Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder',
	styleUrls: [`../../../../css/component/duels/desktop/duels-deckbuilder.component.scss`],
	template: `
		<div class="duels-deckbuilder">
			<!-- First intermediate screen where you select Hero, Hero Power and Signature Treasure  -->
			<!-- Once these are selected, you're brought to the builder proper -->
			<!-- Header should recap this info, add a way to discard the current deck -->
			<!-- Arena to the right should recap the mana curve and maybe other stats -->
			<!-- Need an area to at least search for cards or browse them all by class. Add at least 
			search keywords (like cost:2+ or school:fire) to avoid having too many icons, at least 
			at the beginning -->
			<!-- Need a way to see the buckets that will be offered with the current cards selection -->
			<!-- Need a way to import a deck code -->
			<!-- Need a way to use only your own collection -->
			<!-- Abillity to click on a card in the tracker and automatically filter the cards that synergize with it? -->
			<!-- Don't forget to only include the sets that are allowed in Duels -->

			<div class="list-container">
				<div class="search-box"></div>
				<deck-list class="deck-list" [cards]="currentDeckCards$ | async"> </deck-list>
			</div>
			<div class="results-container">
				<div class="menu"></div>
				<div class="results">
					<cdk-virtual-scroll-viewport [itemSize]="cardHeight" minBufferPx="200" maxBufferPx="400" scrollable>
						<div
							*cdkVirtualFor="let card of activeCards$ | async"
							class="card-container"
							[style.width.px]="cardWidth"
							[style.height.px]="cardHeight"
						>
							<div class="card">
								<img *ngIf="card.imagePath" [src]="card.imagePath" class="real-card" />
							</div>
						</div>
					</cdk-virtual-scroll-viewport>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentDeckCards$: Observable<readonly string[]>;
	activeCards$: Observable<readonly DeckBuilderCard[]>;
	highRes$: Observable<boolean>;

	cardWidth: number;
	cardHeight: number;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		console.debug('azftr');
		this.highRes$ = this.listenForBasicPref$((prefs) => prefs.collectionUseHighResImages);
		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * DEFAULT_CARD_WIDTH;
				this.cardHeight = cardScale * DEFAULT_CARD_HEIGHT;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		const allCards$ = from([this.allCards.getCards()]).pipe(this.mapData((cards) => cards));
		const collection$ = this.store
			.listen$(([main, nav]) => main.binder.collection)
			.pipe(this.mapData(([collection]) => collection));
		this.activeCards$ = combineLatest(allCards$, collection$, this.highRes$).pipe(
			this.mapData(([allCards, collection, highRes]) => {
				return allCards.map(
					(card) =>
						({
							cardId: card.id,
							name: card.name,
							imagePath: this.i18n.getCardImage(card.id, {
								isHighRes: false,
							}),
						} as DeckBuilderCard),
				);
			}),
		);
	}
}

interface DeckBuilderCard {
	readonly cardId: string;
	readonly name: string;
	readonly imagePath: string;
}
