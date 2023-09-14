import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ArchetypeStat, DeckStat } from '@firestone-hs/constructed-deck-stats';
import { sortByProperties } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { Card } from '../../../models/card';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-meta-decks',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`,
	],
	template: `
		<ng-container
			*ngIf="{
				decks: decks$ | async,
				archetypes: archetypes$ | async,
				collection: collection$ | async
			} as value"
		>
			<div class="constructed-meta-decks" *ngIf="value.decks">
				<with-loading [isLoading]="!value.decks?.length">
					<div class="header">
						<div class="cell player-class">Class</div>
						<div class="cell name">Archetype</div>
						<div class="cell dust">Cost</div>
						<div class="cell winrate">Winrate</div>
						<div class="cell games">Games</div>
						<div class="cell cards">Cards</div>
					</div>
					<virtual-scroller
						#scroll
						class="decks-list"
						[items]="value.decks"
						[attr.aria-label]="'Meta deck stats'"
						role="list"
						scrollable
					>
						<constructed-meta-deck-summary
							*ngFor="let deck of scroll.viewPortItems; trackBy: trackByDeck"
							class="deck"
							role="listitem"
							[deck]="deck"
							[archetypes]="value.archetypes"
							[collection]="value.collection"
						></constructed-meta-deck-summary>
					</virtual-scroller>
				</with-loading>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDecksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	decks$: Observable<DeckStat[]>;
	archetypes$: Observable<readonly ArchetypeStat[]>;
	collection$: Observable<readonly Card[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.decks$ = this.store.constructedMetaDecks$().pipe(
			filter((stats) => !!stats?.dataPoints),
			this.mapData((stats) => [...stats.deckStats].sort(sortByProperties((a) => [-a.winrate, -a.totalGames]))),
		);
		this.archetypes$ = this.store.constructedMetaDecks$().pipe(
			filter((stats) => !!stats?.dataPoints),
			this.mapData((stats) => stats.archetypeStats),
		);
		this.collection$ = this.store.collection$().pipe(
			filter((collection) => !!collection),
			debounceTime(500),
			this.mapData((collection) => collection),
		);
	}

	trackByDeck(index: number, item: DeckStat) {
		return item.decklist;
	}
}
