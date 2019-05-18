import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

declare var ga;

@Component({
	selector: 'settings-collection-notification',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/collection/settings-collection-notification.component.scss`,
	],
	template: `
		<div class="collection-notification">
			<h2 class="modes">You can hide some notifications when receiving cards</h2>
			<section class="toggle-label">
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input hidden type="checkbox" 
									[checked]="showDust" 
									name="" 
									id="a-01" 
									(change)="toggleShowDust()">
							<label for="a-01" [ngClass]="{'enabled': showDust}">
								<p class="settings-p">Dust recap</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input hidden type="checkbox" 
									[checked]="showCommon" 
									name="" 
									id="a-01" 
									(change)="toggleShowCommon()">
							<label for="a-01" [ngClass]="{'enabled': showCommon}">
								<p class="settings-p">Non-golden commons</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
			</section>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionNotificationComponent {

	showDust: boolean;
	showCommon: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
	}

	toggleShowDust() {
		this.showDust = !this.showDust;
		this.prefs.setBinderShowDust(this.showDust);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleShowCommon() {
		this.showCommon = !this.showCommon;
		this.prefs.setBinderShowCommon(this.showCommon);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.showDust = prefs.binder.showDust;
		console.log('loaded prefs', prefs);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
