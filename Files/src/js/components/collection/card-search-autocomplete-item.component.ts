import { Component, Input, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';

import { Events } from '../../services/events.service';

@Component({
	selector: 'card-search-autocomplete-item',
	styleUrls: [`../../../css/component/collection/card-search-autocomplete-item.component.scss`],
	template: `
		<li class="card-search-autocomplete">
			<span class="no-match">{{first}}</span>
			<span class="match">{{match}}</span>
			<span class="no-match">{{last}}</span>
		</li>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// 7.1.1.17994
export class CardSearchAutocompleteItemComponent implements OnInit {

	@Input() fullString: string;
	@Input() searchString: string;

	first: string;
	match: string;
	last: string;

	constructor(private events: Events) {
	}

	ngOnInit() {
		// console.log('init autocomplete item', this.fullString, this.searchString);
		let searchIndex = this.fullString.toLowerCase().indexOf(this.searchString.toLowerCase());
		let searchEnd = searchIndex + this.searchString.length;
		// console.log(searchIndex, searchEnd, this.fullString.length);

		this.first = this.fullString.substring(0, searchIndex);
		this.match = this.fullString.substring(searchIndex, Math.min(this.fullString.length, searchEnd));
		if (searchEnd < this.fullString.length) {
			this.last = this.fullString.substring(searchEnd);
		}
		// console.log(this.first, this.match, this.last);
	}
}
