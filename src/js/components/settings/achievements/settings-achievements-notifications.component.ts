import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-achievements-notifications',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-notifications.component.scss`,
	],
	template: `
		<div class="achievements-notifications">
			<h2 class="title">Update when you see achievements notifications</h2>
			<section class="toggle-label">
				<preference-toggle
					field="resetAchievementsOnAppStart"
					label="Streamer mode"
					tooltip="Reset your achievements for the session, so that notifications will show even for unlocked achievements. Uncheck to get all your old achievements back. App restart required"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsNotificationsComponent {}
