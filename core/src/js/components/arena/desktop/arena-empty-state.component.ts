import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'arena-empty-state',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/arena/desktop/arena-empty-state.component.scss`,
	],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/arena.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaEmptyStateComponent {
	@Input() title = 'Nothing here yet';
	@Input() subtitle = 'Start playing Arena to receive information';
}
