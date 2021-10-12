import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { IOption } from 'ng-select';

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
		{ label: this.labelFor(this.FILTER_OWN), value: this.FILTER_OWN },
		{ label: this.labelFor(this.FILTER_DONT_OWN), value: this.FILTER_DONT_OWN },
		{ label: this.labelFor(this.FILTER_ALL), value: this.FILTER_ALL },
	];
	cardsOwnedActiveFilter = this.FILTER_ALL;

	ngAfterViewInit() {
		this.onOptionSelected.next(this.cardsOwnedSelectOptions.find((option) => option.value === this.FILTER_ALL));
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value;
		this.onOptionSelected.next(option);
	}

	private labelFor(filter: string) {
		switch (filter) {
			case this.FILTER_ALL:
				return 'All';
			case this.FILTER_OWN:
				return 'Only the ones I have';
			case this.FILTER_DONT_OWN:
				return 'Only the ones I do not have';

			default:
				console.warn('unknown filter', filter);
		}
	}
}
