import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-decktracker',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker.component.scss`
	],
	template: `
		<ul class="decktracker">
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerComponent {
	
	selectedMenu: string = 'capture';

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}
