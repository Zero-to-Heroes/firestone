import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'duels-empty-state',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-empty-state.component.scss`,
	],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/duels.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsEmptyStateComponent {
	@Input() title = 'Nothing here yet';
	@Input() subtitle = 'Start playing Duels to receive information';
}
