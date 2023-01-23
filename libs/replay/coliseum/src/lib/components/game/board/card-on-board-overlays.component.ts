import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-on-board-overlays',
	styleUrls: ['../../..//text.scss', './card-on-board-overlays.component.scss'],
	template: `
		<div class="card-on-board-overlays" *ngIf="overlays.length > 0">
			<img *ngFor="let overlay of overlays" class="overlay {{ overlay[0] }}" src="{{ overlay[1] }}" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardOnBoardOverlaysComponent {
	overlays: string[][];

	@Input() set entity(value: Entity) {
		console.debug('[card-on-board-overlays] setting entity', value);
		this.overlays = [];
		if (!value) {
			return;
		}
		if (value.getTag(GameTag.IMMUNE) === 1) {
			this.pushOverlay('minion_immune');
		}
		if (value.getTag(GameTag.DIVINE_SHIELD) === 1) {
			this.pushOverlay('minion_divine_shield');
		}
		if (value.getTag(GameTag.REBORN) === 1) {
			this.pushOverlay('minion_reborn');
		}
		if (value.getTag(GameTag.SILENCED) === 1) {
			this.pushOverlay('minion_silenced'); // missing
		}
		if (value.getTag(GameTag.FROZEN) === 1) {
			this.pushOverlay('minion_frozen');
		}
		if (value.getTag(GameTag.STEALTH) === 1) {
			this.pushOverlay('minion_stealth');
		}
		if (
			value.getTag(GameTag.CANT_BE_TARGETED_BY_SPELLS) === 1 &&
			value.getTag(GameTag.CANT_BE_TARGETED_BY_HERO_POWERS) === 1
		) {
			this.pushOverlay('minion_elusive'); // missing
		}
		if (value.getTag(GameTag.WINDFURY) === 1) {
			this.pushOverlay('minion_windfury');
		}
		if (value.getTag(GameTag._333) === 1) {
			this.pushOverlay('minion_temporary_effect');
		}
	}

	private pushOverlay(image: string) {
		this.overlays.push([
			image,
			`https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/${image}.png?v=2`,
		]);
	}
}
