import { Component, Input, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

@Component({
	selector: 'card-search-autocomplete-item',
	styleUrls: [`../../../css/component/collection/card-search-autocomplete-item.component.scss`],
	template: `
		<li>
			<span class="no-match">{{first}}</span>
			<span class="match">{{match}}</span>
			<span class="no-match">{{last}}</span>
		</li>
	`,
})
// 7.1.1.17994
export class CardSearchAutocompleteItemComponent implements OnInit {

	@Input() private fullString: string;
	@Input() private searchString: string;

	private first: string;
	private match: string;
	private last: string;

	ngOnInit() {
		// console.log('init autocomplete item', this.fullString, this.searchString);
		let searchIndex = this.fullString.toLowerCase().indexOf(this.searchString);
		let searchEnd = searchIndex + this.searchString.length;
		console.log(searchIndex, searchEnd, this.fullString.length);

		this.first = this.fullString.substring(0, searchIndex);
		this.match = this.fullString.substring(searchIndex, Math.min(this.fullString.length, searchEnd));
		if (searchEnd < this.fullString.length) {
			this.last = this.fullString.substring(searchEnd);
		}
		// console.log(this.first, this.match, this.last);
	}
}
