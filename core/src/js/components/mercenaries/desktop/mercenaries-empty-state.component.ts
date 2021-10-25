import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'mercenaries-empty-state',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-empty-state.component.scss`,
	],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/mercenaries.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesEmptyStateComponent {
	@Input() title = 'Nothing here yet';
	@Input() subtitle = 'Play some mercenaries matches to get started! Also, check your filters above :)';
}
