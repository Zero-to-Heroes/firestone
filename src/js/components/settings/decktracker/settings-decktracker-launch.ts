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
				<preference-toggle field="decktrackerShowRanked" label="Ranked"></preference-toggle>
				<preference-toggle field="decktrackerShowArena" label="Arena"></preference-toggle>
				<preference-toggle field="decktrackerShowTavernBrawl" label="Tavern Brawl"></preference-toggle>
				<preference-toggle field="decktrackerShowPractice" label="Practice"></preference-toggle>
				<preference-toggle field="decktrackerShowFriendly" label="Friendly"></preference-toggle>
				<preference-toggle field="decktrackerShowCasual" label="Casual"></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerLaunchComponent {}
