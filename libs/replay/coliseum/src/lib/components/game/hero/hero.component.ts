import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { GameConfService } from '../../../services/game-conf.service';
import { GameHelper } from '../../../services/game-helper';

@Component({
	selector: 'hero',
	styleUrls: ['./hero.component.scss'],
	template: `
		<div class="hero">
			<weapon [weapon]="_weapon" *ngIf="_weapon"></weapon>
			<hero-card [hero]="_hero" [playerEntity]="playerEntity" [secrets]="_secrets" [option]="isOption(_hero)">
			</hero-card>
			<hero-power [heroPower]="_heroPower" [option]="isOption(_heroPower)"></hero-power>
			<tavern-level-icon *ngIf="tavernLevel > 0" [level]="tavernLevel"></tavern-level-icon>
			<tavern-button
				class="tavern-upgrade"
				*ngIf="tavernUpgradeEntity"
				[entity]="tavernUpgradeEntity"
				[option]="isOption(tavernUpgradeEntity)"
				[shouldAnimate]="shouldAnimate(tavernUpgradeEntity)"
			></tavern-button>
			<tavern-button
				class="tavern-reroll"
				*ngIf="tavernRerollEntity"
				[entity]="tavernRerollEntity"
				[option]="isOption(tavernRerollEntity)"
				[shouldAnimate]="shouldAnimate(tavernRerollEntity)"
			></tavern-button>
			<tavern-button
				class="tavern-freeze"
				*ngIf="tavernFreezeEntity"
				[entity]="tavernFreezeEntity"
				[option]="isOption(tavernFreezeEntity)"
				[shouldAnimate]="shouldAnimate(tavernFreezeEntity)"
			></tavern-button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
	_entities: Map<number, Entity>;
	_playerId: number;

	_hero: Entity | undefined;
	_heroPower: Entity | undefined;
	_weapon: Entity | undefined;
	_options: readonly number[];
	_secrets: readonly Entity[];
	_opponentId: number;
	playerEntity: Entity | undefined;
	heroOptions: readonly number[];
	tavernLevel: number;
	tavernUpgradeEntity: Entity | undefined;
	tavernRerollEntity: Entity | undefined;
	tavernFreezeEntity: Entity | undefined;
	_entitiesToAnimate: readonly number[];

	constructor(private conf: GameConfService) {}

	@Input() set entities(entities: Map<number, Entity>) {
		// console.log('[hero] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateEntityGroups();
	}

	@Input() set playerId(playerId: number) {
		// console.log('[hero] setting playerId', playerId);
		this._playerId = playerId;
		this.updateEntityGroups();
	}

	@Input() set opponentId(value: number) {
		this._opponentId = value;
		this.updateEntityGroups();
	}

	@Input() set options(value: readonly number[]) {
		// this.logger.info('[hero] setting options', value);
		this._options = value;
		this.updateEntityGroups();
	}

	@Input() set entitiesToAnimate(value: readonly number[]) {
		this._entitiesToAnimate = value;
		this.updateEntityGroups();
	}

	isOption(entity: Entity | undefined): boolean {
		const result = !!this.heroOptions && entity && this.heroOptions.indexOf(entity.id) !== -1;
		// console.log('is option', entity && entity.id, result, this.heroOptions, entity);
		return result ?? false;
	}

	shouldAnimate(entity: Entity) {
		return entity && this._entitiesToAnimate && this._entitiesToAnimate.indexOf(entity.id) !== -1;
	}

	private updateEntityGroups() {
		if (!this._playerId || !this._entities) {
			return;
		}
		this.playerEntity = !!this._entities
			? this._entities.find(
					(entity) =>
						entity.getTag(GameTag.PLAYER_ID) === this._playerId &&
						entity.getTag(GameTag.CARDTYPE) === CardType.PLAYER,
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  )
			: undefined;
		this._hero = this.getHeroEntity(this._entities, this.playerEntity);
		this._heroPower = this.getHeroPowerEntity(this._entities, this._playerId);
		this._weapon = this.getWeaponEntity(this._entities, this._playerId);
		this._secrets = this.getSecretEntities(this._entities, this._playerId);

		// Battlegrounds stuff
		const opponentEntity =
			this._entities && this._entities.find((entity) => entity.getTag(GameTag.PLAYER_ID) === this._opponentId);
		this.tavernLevel =
			opponentEntity &&
			this._hero &&
			this._hero.cardID === 'TB_BaconShopBob' &&
			this.conf.isBattlegrounds() &&
			opponentEntity.getTag(GameTag.PLAYER_TECH_LEVEL)
				? opponentEntity.getTag(GameTag.PLAYER_TECH_LEVEL)
				: 0;
		this.tavernUpgradeEntity = GameHelper.getTavernButton(this._entities, this._opponentId, 3);
		this.tavernRerollEntity = GameHelper.getTavernButton(this._entities, this._opponentId, 2);
		this.tavernFreezeEntity = GameHelper.getTavernButton(this._entities, this._opponentId, 1);
		// console.log('freeze id', this.tavernFreezeEntity && this.tavernFreezeEntity.id, this.tavernFreezeEntity);

		this.heroOptions = GameHelper.getOptions(
			[
				this._hero as Entity,
				this._heroPower as Entity,
				this._weapon as Entity,
				this.tavernUpgradeEntity as Entity,
				this.tavernRerollEntity as Entity,
				this.tavernFreezeEntity as Entity,
			],
			this._options,
		);
		// console.log('hero options', this.heroOptions);
	}

	private getHeroEntity(entities: Map<number, Entity>, playerEntity: Entity | undefined): Entity | undefined {
		// console.log('getting hero from playerentity', playerEntity, playerEntity?.tags?.toJS());
		if (!entities || !playerEntity) {
			return undefined;
		}
		const heroEntityId = playerEntity.getTag(GameTag.HERO_ENTITY);
		const result = entities.get(heroEntityId);
		return result &&
			result.cardID &&
			result.getTag(GameTag.ZONE) === Zone.PLAY &&
			result.cardID !== 'TB_BaconShop_HERO_PH'
			? result
			: undefined;
	}

	private getHeroPowerEntity(entities: Map<number, Entity>, playerId: number): Entity | undefined {
		if (!entities || !playerId) {
			return undefined;
		}
		const heroPower = entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CARDTYPE) === CardType.HERO_POWER)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.PLAY)
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)[0];
		return heroPower;
	}

	private getWeaponEntity(entities: Map<number, Entity>, playerId: number): Entity | undefined {
		if (!entities || !playerId) {
			return undefined;
		}
		return entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CARDTYPE) === CardType.WEAPON)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.PLAY)
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)[0];
	}

	private getSecretEntities(entities: Map<number, Entity>, playerId: number): readonly Entity[] {
		if (!entities || !playerId) {
			return [];
		}
		return entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.SECRET)
			.sort((a, b) => a.getTag(GameTag.ZONE_POSITION) - b.getTag(GameTag.ZONE_POSITION));
	}
}
