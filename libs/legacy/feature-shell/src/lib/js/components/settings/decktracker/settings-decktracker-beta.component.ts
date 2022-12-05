import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-decktracker-beta',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-beta.component.scss`,
	],
	template: `
		<div class="settings-group decktracker-beta">
			<h2 class="modes">Activate beta features</h2>
			<div class="explanation">
				Beta features are features that are functional, but either lack extensive testing or lack a final
				design. Use them to get a sneak peak of what's to come :)
			</div>
			<section class="toggle-label">No beta feature available for now</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerBetaComponent {}
