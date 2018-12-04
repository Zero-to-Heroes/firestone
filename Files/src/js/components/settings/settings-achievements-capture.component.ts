import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements-capture',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements-capture.component.scss`
	],
	template: `
		<div class="achievements-capture">
			<settings-achievements-video-capture></settings-achievements-video-capture>
			<settings-achievements-sound-capture></settings-achievements-sound-capture>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsCaptureComponent {

}
