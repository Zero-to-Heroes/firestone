import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'replays-deckstring-filter-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysDeckstringFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean; options: readonly IOption[] }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
				([main, nav, prefs]) => prefs.replaysActiveDeckstringFilter,
			)
			.pipe(
				filter(([decks, gameModeFilter, deckstringFilter]) => !!decks),
				this.mapData(([decks, gameModeFilter, deckstringFilter]) => {
					const options = [
						{
							value: null,
							label: 'All decks',
						} as IOption,
						...decks.map(
							(deck) =>
								({
									label: deck.deckName,
									value: deck.deckstring,
								} as IOption),
						),
					] as readonly IOption[];
					return {
						options: options,
						filter: deckstringFilter,
						placeholder: options.find((option) => option.value === deckstringFilter)?.label,
						visible: ['ranked', 'ranked-standard', 'ranked-wild', 'ranked-classic'].includes(
							gameModeFilter,
						),
					};
				}),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({ ...prefs, replaysActiveDeckstringFilter: option.value })),
		);
	}
}
