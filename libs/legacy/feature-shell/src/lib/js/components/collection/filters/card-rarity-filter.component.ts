import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { CollectionCardRarityFilterType } from '@models/collection/filter-types';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'card-rarity-filter',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCardRarityFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.options = ['all', 'common', 'rare', 'epic', 'legendary'].map((rarity) => ({
			label: this.i18n.translateString(`app.collection.filters.rarity.${rarity}`),
			value: rarity,
		}));
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionCardRarityFilter)).pipe(
			filter((filter) => !!filter),
			this.mapData((filter) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.prefs.updatePrefs('collectionCardRarityFilter', option.value as CollectionCardRarityFilterType);
	}
}
