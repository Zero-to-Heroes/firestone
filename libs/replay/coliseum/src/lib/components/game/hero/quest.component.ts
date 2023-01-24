import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { Events } from '../../../services/events.service';

@Component({
	selector: 'quest',
	styleUrls: ['./quest.component.scss'],
	template: `
		<div class="quest" [attr.data-entity-id]="entityId">
			<img
				class="quest-image"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_button.png"
			/>
			<img
				class="question-mark"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_bang.png"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestComponent {
	_entity: Entity;
	entityId: number;
	image: string | undefined;
	questionMark: string;

	constructor(private events: Events) {}

	@Input() set entity(value: Entity) {
		// console.debug('[quest] setting new entity', value, value.tags.toJS());
		this._entity = value;
		this.image = undefined;
		if (!value) {
			return;
		}
		this.entityId = value.id;
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		this.events.broadcast(Events.SHOW_QUEST_TOOLTIP, this._entity);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.events.broadcast(Events.HIDE_QUEST_TOOLTIP);
	}
}
