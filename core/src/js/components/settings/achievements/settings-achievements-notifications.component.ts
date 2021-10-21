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
		<div class="settings-group achievements-notifications">
			<h2 class="title">Update when you see achievements notifications</h2>
			<section class="toggle-label">
				<preference-toggle
					field="achievementsEnabled"
					label="Enable FS achievements"
					tooltip="Enable Firestone-exclusive achievements tracking."
				></preference-toggle>
				<preference-toggle
					field="achievementsDisplayNotifications2"
					label="Show notifications"
					tooltip="Display a notification whenever you unlock an achievement. Turning this off also turns Hearthstone's own in-game achievements tracking."
				></preference-toggle>
				<preference-toggle
					*ngIf="isDev"
					field="resetAchievementsOnAppStart"
					label="Streamer mode"
					tooltip="Reset your achievements for the session, so that notifications will show even for unlocked achievements. Uncheck to get all your old achievements back. App restart required"
					advancedSetting
					messageWhenToggleValue="Got it, we won't load your existing achievements next time you start Firestone"
					[valueToDisplayMessageOn]="true"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsNotificationsComponent {
	isDev: boolean;

	constructor() {
		this.isDev = process.env.NODE_ENV !== 'production';
	}
}
