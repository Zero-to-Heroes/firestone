import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	selector: 'preference-numeric-input',
	styleUrls: [
		`../../../../../../../../libs/legacy/feature-shell/src/lib/css/global/toggle.scss`,
		`../../../../../../../../libs/legacy/feature-shell/src/lib/css/component/settings/settings-common.component.scss`,
		`./preference-numeric-input.component.scss`,
	],
	template: `
		<numeric-input
			class="numeric-input"
			[label]="label"
			[labelTooltip]="tooltip"
			[value]="value$ | async"
			[minValue]="minValue"
			[incrementStep]="incrementStep"
			[disabled]="disabled"
			(valueChange)="onValueChanged($event)"
		></numeric-input>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceNumericInputComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	value$: Observable<number>;

	@Input() field: string;
	@Input() label: string;
	@Input() tooltip: string;
	@Input() minValue = 1;
	@Input() incrementStep = 1;
	@Input() disabled: boolean;

	value: boolean;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.value$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs[this.field]));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onValueChanged(newValue: number) {
		await this.prefs.setValue(this.field, newValue);
	}
}
