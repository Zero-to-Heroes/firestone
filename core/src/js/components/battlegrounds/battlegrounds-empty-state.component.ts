import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'battlegrounds-empty-state',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/battlegrounds/battlegrounds-empty-state.component.scss`,
	],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/battlegrounds.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsEmptyStateComponent {
	@Input() title: string = 'Nothing here yet';
	@Input() subtitle: string = 'Start playing Battlegrounds to receive information';
}
