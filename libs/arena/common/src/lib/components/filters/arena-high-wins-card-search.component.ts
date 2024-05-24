import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, tap } from 'rxjs';
import { ArenaHighWinsRunsService } from '../../services/arena-high-wins-runs.service';

@Component({
	selector: 'arena-high-wins-card-search',
	styleUrls: [`./arena-high-wins-card-search.component.scss`],
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
export class ArenaHighWinsCardSearchComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	visible$: Observable<boolean>;
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly runsService: ArenaHighWinsRunsService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.runsService);

		this.options$ = this.runsService.notableCards$$.pipe(
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
		this.filter$ = this.runsService.cardSearch$$.pipe(
			tap((filter) => console.debug('[multiselect] before setting filter', filter)),
			this.mapData((filter) => ({
				selected: filter?.map((a) => '' + a) ?? [],
				placeholder: this.i18n.translateString(`app.decktracker.filters.card-filter.all`),
			})),
			tap((filter) => console.debug('[multiselect] setting filter', filter)),
		) as any;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(cards: readonly string[]) {
		this.runsService.newCardSearch(cards);
	}
}
