import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DeckStat } from '@firestone-hs/deck-stats';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'constructed-meta-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`,
	],
	template: `
		<div class="constructed-meta-decks" *ngIf="decks$ | async as decks">
			<with-loading [isLoading]="!decks?.length">
				<ul class="deck-list" scrollable [attr.aria-label]="'Meta deck stats'" role="list">
					<li *ngFor="let deck of decks">
						<constructed-meta-deck-summary [deck]="deck" role="listitem"></constructed-meta-deck-summary>
					</li>
				</ul>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<readonly DeckStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.decks$ = this.store
			.listen$(([main, nav, prefs]) => main.decktracker.getMetaDecks())
			.pipe(
				filter(([decks]) => !!decks?.length),
				this.mapData(([decks]) => decks),
			);
	}
}
