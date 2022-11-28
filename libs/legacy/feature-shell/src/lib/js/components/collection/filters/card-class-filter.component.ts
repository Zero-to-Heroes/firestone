import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CollectionCardClassFilterType } from '@models/collection/filter-types';
import { classes } from '@services/hs-utils';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'card-class-filter',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
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
export class CollectionCardClassFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.options = ['all', 'neutral', ...classes].map((playerClass) => ({
			label: this.i18n.translateString(`global.class.${playerClass}`),
			value: playerClass,
		}));
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.collectionCardClassFilter)
			.pipe(
				filter(([filter]) => !!filter),
				this.mapData(([filter]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: true,
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				collectionCardClassFilter: option.value as CollectionCardClassFilterType,
			})),
		);
	}
}
