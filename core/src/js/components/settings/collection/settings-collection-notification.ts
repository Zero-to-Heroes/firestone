import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-collection-notification',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/collection/settings-collection-notification.component.scss`,
	],
	template: `
		<div class="collection-notification">
			<section class="settings-group toggle-label">
				<h2 class="modes">You can selectively show some card notifications</h2>
				<preference-toggle field="showDust" label="Dust recap"></preference-toggle>
				<preference-toggle field="showCommon" label="Non-golden commons"></preference-toggle>
				<preference-toggle
					field="showCardsOutsideOfPacks"
					label="Rewards"
					tooltip="Display a notification whenever you get a card outside of a pack, typically end-of-season or Arena rewards"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionNotificationComponent {}
