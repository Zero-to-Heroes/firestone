import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { sortByProperties } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-meta-decks',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`,
	],
	template: `
		<div class="constructed-meta-decks" *ngIf="decks$ | async as decks">
			<with-loading [isLoading]="!decks?.length">
				<div class="header">
					<div class="cell player-class">Class</div>
					<div class="cell name">Archetype</div>
					<div class="cell winrate">Winrate</div>
					<div class="cell games">Games</div>
					<div class="cell cards">Cards</div>
				</div>
				<virtual-scroller
					#scroll
					class="decks-list"
					[items]="decks"
					[attr.aria-label]="'Meta deck stats'"
					role="list"
					scrollable
				>
					<constructed-meta-deck-summary
						*ngFor="let deck of scroll.viewPortItems; trackBy: trackByDeck"
						class="deck"
						[deck]="deck"
						role="listitem"
					></constructed-meta-deck-summary>
				</virtual-scroller>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDecksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	decks$: Observable<DeckStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.decks$ = this.store.constructedMetaDecks$().pipe(
			filter((stats) => !!stats?.dataPoints),
			this.mapData((stats) => [...stats.deckStats].sort(sortByProperties((a) => [-a.winrate, -a.totalGames]))),
		);
	}

	trackByDeck(index: number, item: DeckStat) {
		return item.decklist;
	}
}
