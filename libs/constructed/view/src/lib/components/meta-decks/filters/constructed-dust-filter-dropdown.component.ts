import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOptionWithImage } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'constructed-dust-filter-dropdown',
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
export class ConstructedDustFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: DustFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.duels.filters.dust.all'),
			} as DustFilterOption,
			{
				value: '0',
				label: this.i18n.translateString('app.duels.filters.dust.own'),
			} as DustFilterOption,
			{
				value: '400',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 400 }),
			} as DustFilterOption,
			{
				value: '1600',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 1600 }),
			} as DustFilterOption,
			{
				value: '3200',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 3200 }),
			} as DustFilterOption,
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksDustFilter ?? 'all')),
		]).pipe(
			this.mapData(([dustFilter]) => {
				return {
					filter: '' + dustFilter,
					placeholder: this.options.find((option) => option.value === '' + dustFilter)?.label ?? '',
					visible: true,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async onSelected(option: IOptionWithImage) {
		this.prefs.updatePrefs('constructedMetaDecksDustFilter', option.value === 'all' ? 'all' : +option.value);
	}
}

interface DustFilterOption extends IOptionWithImage {
	value: string;
}
