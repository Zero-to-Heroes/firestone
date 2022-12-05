import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Set } from '../../models/set';

@Component({
	selector: 'collection-empty-state',
	styleUrls: [`../../../css/component/collection/collection-empty-state.component.scss`],
	template: `
		<ng-container [ngSwitch]="sectionSelector">
			<section class="empty-state no-missing-card-in-set" *ngSwitchCase="NO_MISSING_CARD_IN_SET">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#empty_state_Only_cards_I_don’t_have_illustration" />
						</svg>
					</i>
					<span
						class="title"
						[owTranslate]="'app.collection.empty-state.no-missing-card-in-set.title'"
					></span>
					<span
						class="subtitle"
						[owTranslate]="'app.collection.empty-state.no-missing-card-in-set.subtitle'"
					></span>
				</div>
			</section>
			<section class="empty-state no-card-in-set" *ngSwitchCase="NO_CARD_IN_SET">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#empty_state_Only_cards_I_have_illustration" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.collection.empty-state.no-card-in-set.title'"></span>
					<span class="subtitle" [owTranslate]="'app.collection.empty-state.no-card-in-set.subtitle'"></span>
				</div>
			</section>
			<section class="empty-state no-golden-card-in-set" *ngSwitchCase="NO_GOLDEN_IN_SET">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#empty_state_Only_golden_cards_I_have_illustration" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.collection.empty-state.no-golden-card-in-set.title'"></span>
					<span
						class="subtitle"
						[owTranslate]="'app.collection.empty-state.no-golden-card-in-set.subtitle'"
					></span>
				</div>
			</section>
			<section class="empty-state no-search-result" *ngSwitchCase="NO_SEARCH_RESULT">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#No_result_illustration" />
						</svg>
					</i>
					<span
						class="title"
						[owTranslate]="'app.collection.empty-state.no-search-results.title'"
						[translateParams]="{ value: _searchString }"
					></span>
					<span
						class="subtitle"
						[owTranslate]="'app.collection.empty-state.no-search-results.subtitle'"
					></span>
				</div>
			</section>
			<section class="empty-state no-search-result" *ngSwitchCase="DEFAULT">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#No_result_illustration" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.collection.empty-state.default.title'"></span>
					<span class="subtitle" [owTranslate]="'app.collection.empty-state.default.subtitle'"></span>
				</div>
			</section>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionEmptyStateComponent {
	readonly NO_MISSING_CARD_IN_SET = 'no-missing-card-in-set';
	readonly NO_CARD_IN_SET = 'no-card-in-set';
	readonly NO_GOLDEN_IN_SET = 'no-golden-in-set';
	readonly NO_SEARCH_RESULT = 'no-search-result';
	readonly DEFAULT = 'default';

	// TODO: duplicate from CardsComponent, not good
	readonly FILTER_OWN = 'own';
	readonly FILTER_GOLDEN_OWN = 'goldenown';
	readonly FILTER_DONT_OWN = 'dontown';
	readonly FILTER_ALL = 'all';

	sectionSelector: string = this.DEFAULT;

	_set: Set;
	_activeFilter: string;
	_searchString: string;

	@Input('set') set set(set: Set) {
		this._set = set;
		this.updateSectionSelector();
	}

	@Input('activeFilter') set activeFilter(activeFilter: string) {
		this._activeFilter = activeFilter;
		this.updateSectionSelector();
	}

	@Input('searchString') set searchString(searchString: string) {
		this._searchString = searchString;
		this.updateSectionSelector();
	}

	private updateSectionSelector() {
		this.sectionSelector = undefined;
		if (this._set && this._activeFilter === this.FILTER_DONT_OWN) {
			this.sectionSelector = this.NO_MISSING_CARD_IN_SET;
		} else if (this._set && this._activeFilter === this.FILTER_OWN) {
			this.sectionSelector = this.NO_CARD_IN_SET;
		} else if (this._set && this._activeFilter === this.FILTER_GOLDEN_OWN) {
			this.sectionSelector = this.NO_GOLDEN_IN_SET;
		} else if (this._searchString) {
			this.sectionSelector = this.NO_SEARCH_RESULT;
		}
	}
}
