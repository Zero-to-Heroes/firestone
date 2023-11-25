import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option',
	styleUrls: ['./arena-card-option.component.scss'],
	template: `
		<div class="option">
			<div class="info-container">
				<div class="winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-winrate'"></span
					><span class="value">{{ drawnWinrate }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardOptionComponent {
	@Input() set card(value: ArenaCardOption) {
		console.debug('[arena-card-option] setting hero', value);
		this.drawnWinrate = (100 * value.drawnWinrate).toFixed(1) + '%';
	}

	drawnWinrate: string;
}
