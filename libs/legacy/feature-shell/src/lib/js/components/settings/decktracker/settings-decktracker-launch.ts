import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-decktracker-launch',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-launch.component.scss`,
	],
	template: `
		<div class="settings-group decktracker-launch">
			<h2 class="modes" [owTranslate]="'settings.decktracker.modes.title'"></h2>
			<section class="toggle-label">
				<preference-toggle
					field="decktrackerShowRanked"
					[label]="'settings.decktracker.modes.ranked' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowDuels"
					[label]="'settings.decktracker.modes.duels' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowArena"
					[label]="'settings.decktracker.modes.arena' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowTavernBrawl"
					[label]="'settings.decktracker.modes.tavern-brawl' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowPractice"
					[label]="'settings.decktracker.modes.practice' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowFriendly"
					[label]="'settings.decktracker.modes.friendly' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowCasual"
					[label]="'settings.decktracker.modes.casual' | owTranslate"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerLaunchComponent {}
