import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

declare var ga;

@Component({
	selector: 'settings-decktracker-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-launch.component.scss`,
	],
	template: `
		<div class="decktracker-launch">
			<h2 class="modes">Decktracker is active for the following modes</h2>
			<section class="toggle-label">
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input hidden type="checkbox" 
									[checked]="showRanked" 
									name="" 
									id="a-01" 
									(change)="toggleRanked()">
							<label for="a-01" [ngClass]="{'enabled': showRanked}">
								<p class="settings-p">Ranked</p>
								<b></b>
							</label>
						</div>
					</fieldset>
				</form>
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input hidden type="checkbox" 
									[checked]="showArena" 
									name="" 
									id="a-02" 
									(change)="toggleArena()">
							<label for="a-02" [ngClass]="{'enabled': showArena}">
								<p class="settings-p">Arena</p>
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
export class SettingsDecktrackerLaunchComponent {

	showRanked: boolean;
	showArena: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
	}

	toggleRanked() {
		this.showRanked = !this.showRanked;
		this.prefs.setDecktrackerShowRanked(this.showRanked);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleArena() {
		this.showArena = !this.showArena;
		this.prefs.setDecktrackerShowArena(this.showArena);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.showArena = prefs.decktrackerShowArena;
		this.showRanked = prefs.decktrackerShowRanked;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
