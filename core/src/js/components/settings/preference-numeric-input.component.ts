import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import {} from 'lodash';
import { Observable } from 'rxjs';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'preference-numeric-input',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-numeric-input.component.scss`,
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

	constructor(
		private prefs: PreferencesService,
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.value$ = this.listenForBasicPref$((prefs) => prefs[this.field]);
	}

	async onValueChanged(newValue: number) {
		await this.prefs.setValue(this.field, newValue);
	}
}
