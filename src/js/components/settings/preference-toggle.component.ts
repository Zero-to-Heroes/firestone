import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'preference-toggle',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-toggle.component.scss`,
	],
	template: `
		<div class="preference-toggle">
			<input hidden type="checkbox" [checked]="value" name="" id="a-01-{{ field }}" (change)="toggleValue()" />
			<label for="a-01-{{ field }}" [ngClass]="{ 'enabled': value }">
				<p class="settings-p">
					{{ label }}
				</p>
				<b></b>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceToggleComponent {
	@Input() field: string;
	@Input() label: string;

	value: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef) {
		this.loadDefaultValues();
	}

	toggleValue() {
		this.value = !this.value;
		this.prefs.setValue(this.field, this.value);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.value = prefs[this.field];
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
