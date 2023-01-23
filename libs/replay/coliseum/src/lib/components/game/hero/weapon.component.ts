import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'weapon',
	styleUrls: ['./weapon.component.scss'],
	template: `
		<div class="weapon" cardTooltip [tooltipEntity]="_weapon" [attr.data-entity-id]="entityId">
			<weapon-art [cardId]="cardId" *ngIf="!exhausted"></weapon-art>
			<weapon-frame [exhausted]="exhausted"></weapon-frame>
			<weapon-stats [cardId]="cardId" [attack]="attack" [durability]="durability" [damage]="damage">
			</weapon-stats>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponComponent {
	entityId: number;
	cardId: string;
	attack: number;
	durability: number;
	damage: number;
	exhausted: boolean;
	_weapon: Entity;

	@Input() set weapon(value: Entity) {
		if (!value) {
			return;
		}
		console.debug('[weapon] setting new weapon', value, value.tags.toJS());
		this._weapon = value;
		this.entityId = value.id;
		this.cardId = value.cardID;
		this.attack = value.getTag(GameTag.ATK);
		this.durability = value.getTag(GameTag.DURABILITY);
		this.damage = value.getTag(GameTag.DAMAGE);
		this.exhausted = value.getTag(GameTag.EXHAUSTED) === 1;
	}
}
