import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

declare var ga;

@Component({
	selector: 'settings-decktracker-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-launch.component.scss`
	],
	template: `
		<div class="decktracker-launch">
			<h2 class="modes">Decktracker is active for the following modes</h2>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerLaunchComponent {

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
	}
}
