import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'hero-card',
	styleUrls: ['./hero-card.component.scss'],
	template: `
		<div
			class="hero-card"
			[ngClass]="{ highlight: _option }"
			[attr.data-entity-id]="entityId"
			[attr.data-player-entity-id]="playerEntityId"
		>
			<hero-art [cardId]="cardId"></hero-art>
			<hero-frame [premium]="premium"></hero-frame>
			<hero-overlays [entity]="_entity"></hero-overlays>
			<secrets [secrets]="_secrets" *ngIf="_secrets && _secrets.length > 0"></secrets>
			<hero-stats [cardId]="cardId" [attack]="attack" [health]="health" [damage]="damage" [armor]="armor">
			</hero-stats>
			<damage *ngIf="shownDamage" [amount]="shownDamage"></damage>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCardComponent {
	_entity: Entity | undefined;
	_playerEntity: Entity | undefined;
	// Some actions use the player id instead of the entity id when describing targets
	// so having both of them makes us able to ignore these discrepancies
	playerEntityId: number | undefined;
	entityId: number | undefined;
	cardId: string | undefined;
	cardType: CardType | undefined;
	attack: number;
	health: number;
	damage: number;
	armor: number;
	shownDamage: number;
	premium: boolean;
	_option: boolean;
	_secrets: readonly Entity[] | undefined;

	@Input() set hero(hero: Entity | undefined) {
		// console.log('[hero-card] setting hero', hero, hero && hero.tags.toJS());
		this._entity = hero;
		this.updateInfo();
	}

	@Input() set playerEntity(value: Entity | undefined) {
		this._playerEntity = value;
		this.updateInfo();
	}

	private updateInfo() {
		this.entityId = this._entity ? this._entity.id : undefined;
		this.playerEntityId = this._playerEntity ? this._playerEntity.id : undefined; // If they ever change this logic we need to do something :)
		this.cardId = this._entity ? this._entity.cardID : undefined;
		this.cardType = CardType.HERO;
		this.attack = this._entity ? this._entity.getTag(GameTag.ATK) : 0;
		this.health = this._entity ? this._entity.getTag(GameTag.HEALTH) : 0;
		this.damage = this._entity ? this._entity.getTag(GameTag.DAMAGE) : 0;
		this.armor = this._entity ? this._entity.getTag(GameTag.ARMOR) : 0;
		this.premium = this._entity ? this._entity.getTag(GameTag.PREMIUM) === 1 : false;

		this.shownDamage = this._entity ? this._entity.damageForThisAction : 0;
	}

	@Input() set option(value: boolean) {
		this._option = value;
	}

	@Input() set secrets(value: readonly Entity[]) {
		// console.log('[hero-card] setting secrets', value);
		this._secrets = value;
	}
}
