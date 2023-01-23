import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'quest-completed',
	styleUrls: ['./quest-completed.component.scss'],
	template: `
		<div class="quest-completed">
			<card [entity]="_quest" [hasTooltip]="false"></card>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestCompletedComponent {
	_quest: Entity;

	@Input() set quest(value: Entity) {
		console.debug('[quest-completed] setting quest', value);
		this._quest = value;
	}
}
