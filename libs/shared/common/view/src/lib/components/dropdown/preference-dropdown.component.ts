import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';

@Component({
	selector: 'preferences-dropdown',
	styleUrls: [`./preference-dropdown.component.scss`],
	template: `
		<label class="label" *ngIf="label">
			{{ label }}
			<div class="info" *ngIf="tooltip" [helpTooltip]="tooltip"></div>
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
export class PreferenceDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Input() options: readonly IOption[];
	@Input() field: string;
	@Input() label: string | null;
	@Input() tooltip: string | null;
	@Input() afterSelection: ((newValue: string) => void) | undefined;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				filter: prefs[this.field],
				placeholder: this.options.find((option) => option.value === prefs[this.field])?.label ?? '',
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(option: IOption) {
		this.prefs.setValue(this.field, option.value);
		if (this.afterSelection) {
			this.afterSelection(option.value);
		}
	}
}
