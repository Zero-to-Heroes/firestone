import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-achievements-live',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-live.component.scss`,
	],
	template: `
		<div class="settings-group achievements-live">
			<h2 class="title">Live achievements tracking</h2>
			<section class="toggle-label">
				<preference-toggle
					field="achievementsLiveTracking2"
					label="Enable live tracker (alpha)"
					tooltip="(ALPHA) Shows a new window (ideally for second screens) where you can see the progress towards each of the HS native achievements during a match. It's still a very early alpha build, and any feedback is welcome :)"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsLiveComponent {}
