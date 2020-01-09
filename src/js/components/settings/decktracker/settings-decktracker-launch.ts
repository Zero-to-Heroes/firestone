import { ChangeDetectionStrategy, Component } from '@angular/core';

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
		<div class="settings-group decktracker-launch">
			<h2 class="modes">Decktracker is active for the following modes</h2>
			<section class="toggle-label">
				<preference-toggle field="showRanked" label="Ranked"></preference-toggle>
				<preference-toggle field="showArena" label="Arena"></preference-toggle>
				<preference-toggle field="showTavernBrawl" label="Tavern Brawl"></preference-toggle>
				<preference-toggle field="showPractice" label="Practice"></preference-toggle>
				<preference-toggle field="showFriendly" label="Friendly"></preference-toggle>
				<preference-toggle field="showCasual" label="Casual"></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerLaunchComponent {}
