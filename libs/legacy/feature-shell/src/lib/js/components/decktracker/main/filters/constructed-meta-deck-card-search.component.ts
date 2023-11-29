import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ConstructedMetaDecksStateService } from '@legacy-import/src/lib/js/services/decktracker/constructed-meta-decks-state-builder.service';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { Observable, tap } from 'rxjs';

@Component({
	selector: 'constructed-meta-deck-card-search',
	styleUrls: [`./constructed-meta-deck-card-search.component.scss`],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="true"
			[allowSearch]="true"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckCardSearchComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	visible$: Observable<boolean>;
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.constructedMetaStats.isReady();

		this.options$ = this.constructedMetaStats.allCardsInDeck$$.pipe(
			this.mapData((cards) => {
				const options: MultiselectOption[] = (cards ?? [])
					.map((cardId) => {
						const result = {
							value: cardId,
							label: this.allCards.getCard(cardId).name,
							image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
						};
						return result;
					})
					.sort(sortByProperties((a) => [a.label]));
				return options;
			}),
		);
		this.filter$ = this.constructedMetaStats.cardSearch$$.pipe(
			this.mapData((filter) => ({
				selected: filter.map((a) => '' + a),
				placeholder: this.i18n.translateString(`app.decktracker.filters.card-filter.all`),
			})),
			tap((filter) => console.debug('[multiselect] setting filter', filter)),
		) as any;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(cards: readonly string[]) {
		this.constructedMetaStats.newCardSearch(cards);
	}
}
