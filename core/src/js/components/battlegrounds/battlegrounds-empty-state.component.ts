import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'battlegrounds-empty-state',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/battlegrounds/battlegrounds-empty-state.component.scss`,
	],
	template: `
		<div class="empty-state">
			<div class="loading-icon" [inlineSVG]="emptyStateIcon"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsEmptyStateComponent {
	@Input() title = 'Nothing here yet';
	@Input() subtitle = 'Start playing Battlegrounds to receive information';
	@Input() emptyStateIcon = 'assets/svg/ftue/battlegrounds.svg';
}
