import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { LocalizationUpdateEvent } from '../../../services/mainwindow/store/events/localization-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'localization-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/global/scrollbar.scss`,
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
export class LocalizationDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: readonly IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.options = [
			{
				value: 'deDE',
				label: 'Deutsch',
			} as IOption,
			{
				value: 'enUS',
				label: 'English',
			} as IOption,
			{
				value: 'esES',
				label: 'Espa\u00f1ol (EU)',
			} as IOption,
			{
				value: 'esMX',
				label: 'Espa\u00f1ol (AL)',
			} as IOption,
			{
				value: 'frFR',
				label: 'Fran\u00e7ais',
			} as IOption,
			{
				value: 'itIT',
				label: 'Italiano',
			} as IOption,
			{
				value: 'jaJP',
				label: '\u65e5\u672c\u8a9e',
			} as IOption,
			{
				value: 'koKR',
				label: '\ud55c\uad6d\uc5b4',
			} as IOption,
			{
				value: 'plPL',
				label: 'Polski',
			} as IOption,
			{
				value: 'ptBR',
				label: 'Portugu\u00eas (BR)',
			} as IOption,
			{
				value: 'ruRU',
				label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
			} as IOption,
			{
				value: 'thTH',
				label: '\u0e44\u0e17\u0e22',
			} as IOption,
			{
				value: 'zhCN',
				label: '\u7b80\u4f53\u4e2d\u6587',
			} as IOption,
			{
				value: 'zhTW',
				label: '\u7e41\u9ad4\u4e2d\u6587',
			} as IOption,
		] as readonly IOption[];
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.locale)
			.pipe(
				this.mapData(([pref]) => ({
					filter: pref,
					placeholder: this.options.find((option) => option.value === pref)?.label,
					visible: true,
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(new LocalizationUpdateEvent(option.value));
	}
}
