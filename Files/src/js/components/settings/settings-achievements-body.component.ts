import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements-body',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements-body.component.scss`
	],
	template: `
		<div class="achievements-body">
		<settings-achievements-video-quality></settings-achievements-video-quality>
		<settings-achievements-sound-capture></settings-achievements-sound-capture>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsBodyComponent {

}
