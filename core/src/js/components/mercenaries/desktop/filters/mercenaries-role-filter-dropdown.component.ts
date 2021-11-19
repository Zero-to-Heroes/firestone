import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesRoleFilterType } from '../../../../models/mercenaries/mercenaries-filter-types';
import { MercenariesRoleFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-role-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-role-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-role-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesRoleFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: readonly RoleFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.options = [
			{
				value: 'all',
				label: 'All roles',
			} as RoleFilterOption,
			{
				value: 'caster',
				label: 'Casters',
			} as RoleFilterOption,
			{
				value: 'protector',
				label: 'Protectors',
			} as RoleFilterOption,
			{
				value: 'fighter',
				label: 'Fighters',
			} as RoleFilterOption,
		] as readonly RoleFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.mercenariesActiveRoleFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: selectedCategoryId === 'mercenaries-hero-stats',
					// || selectedCategoryId === 'mercenaries-personal-hero-stats',
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	onSelected(option: RoleFilterOption) {
		this.store.send(new MercenariesRoleFilterSelectedEvent(option.value));
	}
}

interface RoleFilterOption extends IOption {
	value: MercenariesRoleFilterType;
}
