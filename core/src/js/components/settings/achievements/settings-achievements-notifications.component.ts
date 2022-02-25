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
			<h2 class="title" [owTranslate]="'settings.achievements.notifications.title'"></h2>
			<section class="toggle-label">
				<preference-toggle
					field="achievementsEnabled2"
					[label]="'settings.achievements.notifications.firestone-achievements-text' | owTranslate"
					[tooltip]="'settings.achievements.notifications.firestone-achievements-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="achievementsDisplayNotifications2"
					[label]="'settings.achievements.notifications.show-notifications-text' | owTranslate"
					[tooltip]="'settings.achievements.notifications.show-notifications-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					*ngIf="isDev"
					field="resetAchievementsOnAppStart"
					[label]="'settings.achievements.notifications.streamer-mode-text' | owTranslate"
					[tooltip]="'settings.achievements.notifications.streamer-mode-tooltip' | owTranslate"
					advancedSetting
					[messageWhenToggleValue]="
						'settings.achievements.notifications.streamer-mode-confirmation' | owTranslate
					"
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
