import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

declare var ga;

@Component({
	selector: 'settings-decktracker-appearance',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-appearance.component.scss`,
	],
	template: `
		<div class="decktracker-appearance">
            <section class="toggle-label">
                <form class="settings-section form-toggle">
                    <fieldset name="">
                        <div class="form-section">
                            <input hidden type="checkbox" 
                                    [checked]="cleanMode" 
                                    name="" 
                                    id="a-01" 
                                    (change)="toggleCleanMode()">
                            <label for="a-01" [ngClass]="{'enabled': cleanMode}">
                                <b></b>
                                <p class="settings-p">Clean mode</p>
                                <i class="info">
                                    <svg>
                                        <use xlink:href="/Files/assets/svg/sprite.svg#info"/>
                                    </svg>
                                    <div class="zth-tooltip right">
                                        <p>The clean mode focuses on showing you the cards. It removes most of the decktracker styling to show you the decklist as cleanly as possible.</p>
                                        <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                                            <polygon points="0,0 8,-9 16,0"/>
                                        </svg>
                                    </div>
                                </i>
                            </label>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerAppearanceComponent {

	cleanMode: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.cdr.detach();
		this.loadDefaultValues();
	}

	toggleCleanMode() {
		this.cleanMode = !this.cleanMode;
		this.prefs.setDecktrackerCleanMode(this.cleanMode);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.cleanMode = prefs.decktrackerCleanMode;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
