import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'minion-on-board-overlay',
	styleUrls: ['../../../../css/component/overlays/board/minion-on-board-overlay.component.scss'],
	template: `
		<div class=" card">
			<div class="turn-number-container">
				<span class="turn-number">{{ playOrder }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinionOnBoardOverlayComponent {
	@Input() playOrder: number;
}
