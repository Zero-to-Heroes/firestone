import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements.component.scss`
	],
	template: `
		<ul class="achievements">
			<settings-achievements-menu></settings-achievements-menu>
			<settings-achievements-body></settings-achievements-body>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsComponent {
}
