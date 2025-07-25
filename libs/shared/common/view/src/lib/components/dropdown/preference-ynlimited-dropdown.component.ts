import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BooleanWithLimited, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';

@Component({
	selector: 'preference-ynlimited',
	styleUrls: [`./preference-dropdown.component.scss`, `./preference-ynlimited-dropdown.component.scss`],
	template: `
		<label class="label">
			{{ label }}
			<div class="info" *ngIf="tooltip" [helpTooltip]="tooltip" inlineSVG="assets/svg/info.svg"></div>
		</label>
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
export class PreferenceYNLimitedComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Input() field: string;
	@Input() label: string | null;
	@Input() tooltip: string | null;

	options: BooleanOption[] = [
		{
			value: 'true',
			label: this.i18n.translateString('settings.global.counter-dropdown.on'),
			tooltip: this.i18n.translateString('settings.global.counter-dropdown.on-tooltip'),
		},
		{
			value: 'false',
			label: this.i18n.translateString('settings.global.counter-dropdown.off'),
			tooltip: this.i18n.translateString('settings.global.counter-dropdown.off-tooltip'),
		},
		{
			value: 'limited',
			label: this.i18n.translateString('settings.global.counter-dropdown.limited'),
			tooltip: this.i18n.translateString('settings.global.counter-dropdown.limited-tooltip'),
		},
	];

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs[this.field]),
			this.mapData((pref) => ({
				filter: '' + pref,
				placeholder: this.options.find((option) => this.convertToBoolean(option.value) === pref)?.label ?? '',
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(option: /*BooleanOption*/ IOption) {
		const valueToUse = this.convertToBoolean(option.value as BooleanOption['value']);
		this.prefs.setValue(this.field, valueToUse);
	}

	private convertToBoolean(value: boolean | BooleanOption['value']): BooleanWithLimited {
		return value === 'true' ? true : value === 'false' ? false : value;
	}
}

interface BooleanOption extends IOption {
	value: 'true' | 'false' | 'limited';
	tooltip: string;
}
