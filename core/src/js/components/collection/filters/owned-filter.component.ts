import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { IOption } from 'ng-select';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'collection-owned-filter',
	styleUrls: [
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/collection/filters/owned-filter.component.scss`,
	],
	template: `
		<div>
			<fs-filter-dropdown
				class="owned-filter"
				[options]="cardsOwnedSelectOptions"
				[filter]="cardsOwnedActiveFilter"
				(onOptionSelected)="selectCardsOwnedFilter($event)"
			></fs-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnedFilterComponent implements AfterViewInit {
	@Output() onOptionSelected: EventEmitter<IOption> = new EventEmitter<IOption>();

	readonly FILTER_OWN = 'own';
	readonly FILTER_DONT_OWN = 'dontown';
	readonly FILTER_ALL = 'all';

	cardsOwnedSelectOptions: IOption[] = [
		{ label: this.i18n.translateString('app.collection.filters.owned.pwn'), value: this.FILTER_OWN },
		{ label: this.i18n.translateString('app.collection.filters.owned.dontown'), value: this.FILTER_DONT_OWN },
		{ label: this.i18n.translateString('app.collection.filters.owned.all'), value: this.FILTER_ALL },
	];
	cardsOwnedActiveFilter = this.FILTER_ALL;

	constructor(private readonly i18n: LocalizationFacadeService) {}

	ngAfterViewInit() {
		this.onOptionSelected.next(this.cardsOwnedSelectOptions.find((option) => option.value === this.FILTER_ALL));
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value;
		this.onOptionSelected.next(option);
	}
}
