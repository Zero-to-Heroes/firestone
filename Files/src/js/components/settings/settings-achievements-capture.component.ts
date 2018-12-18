import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements-capture',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/scrollbar-settings.scss`,
		`../../../css/component/settings/settings-achievements-capture.component.scss`
	],
	template: `
		<div class="achievements-capture">
			<settings-achievements-video-capture></settings-achievements-video-capture>
			<settings-achievements-sound-capture></settings-achievements-sound-capture>
			<settings-achievements-storage></settings-achievements-storage>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsCaptureComponent {

}
