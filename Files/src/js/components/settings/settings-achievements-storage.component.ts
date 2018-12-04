import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'settings-achievements-storage',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements-storage.component.scss`
	],
	template: `
		<div class="achievements-storage">
			Hopla
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsStorageComponent {

}
