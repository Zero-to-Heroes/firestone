import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattleSpeedModifier } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';

@Component({
	selector: 'mercenaries-team-ability',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/directive/mercenaries-highlight.directive.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-ability.component.scss',
	],
	template: `
		<div
			class="item"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="tooltipPosition"
			[ngClass]="{ 'inactive': cooldownLeft > 0 }"
			[mercenariesHighlight]="cardId"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="gradiant"></div>
			<div class="ability-item-icon" [ngClass]="{ 'treasure': isTreasure }" *ngIf="type === 'ability'">
				<img class="icon" [src]="buildAbilityArtUrl(cardId)" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png"
				/>
			</div>
			<div class="equipment-item-icon" [cardTooltip]="cardId" *ngIf="type === 'equipment'">
				<img class="icon" [src]="buildAbilityArtUrl(cardId)" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png"
				/>
			</div>
			<div
				class="item ability-speed"
				[ngClass]="{ 'buff': speed < baseSpeed, 'debuff': speed > baseSpeed }"
				*ngIf="speed != null"
				[helpTooltip]="speedModifierTooltip"
			>
				<div class="value">{{ speedForDisplay }}</div>
				<img
					class="speed-icon"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_speed_icon.png"
				/>
			</div>
			<div class="name">
				<span>{{ name }}</span>
			</div>
			<div
				class="cooldown-left"
				*ngIf="!!cooldownLeft"
				[helpTooltip]="'mercenaries.team-widget.cooldown-left-tooltip' | owTranslate"
			>
				<img
					class="cooldown-icon"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png"
				/>
				<div class="value">{{ cooldownLeft }}</div>
			</div>
			<div
				class="number-of-uses"
				*ngIf="totalUsed > 0"
				[helpTooltip]="'mercenaries.team-widget.number-of-users-tooltip' | owTranslate"
			>
				<span>{{ totalUsed }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamAbilityComponent {
	@Input() tooltipPosition: boolean;

	@Input() set ability(value: Ability) {
		// console.debug('set ability', this.allCards.getCard(value.cardId).name, value);
		const abilityCard = this.allCards.getCard(value.cardId);
		this.type = value.type;
		this.cardId = value.cardId;
		this.cardImage = value.cardImage;
		this.name = abilityCard.name;
		this.cooldown = value.cooldown;
		this.cooldownLeft = value.cooldownLeft;
		this.isTreasure = value.isTreasure;
		this.totalUsed = value.totalUsed;
		this.speedModifier =
			!!value.speedModifier || !!value.heroSpeedModifier
				? {
						value: (value.speedModifier?.value ?? 0) + (value.heroSpeedModifier?.value ?? 0),
						influences: [
							...(value.speedModifier?.influences ?? []),
							...(value.heroSpeedModifier?.influences ?? []),
						],
				  }
				: null;
		this.baseSpeed = abilityCard.cost;
		this.speed =
			value.speed == null
				? null
				: // The speed has been directly modified because of a COST tag change
				value.speed !== this.baseSpeed
				? value.speed
				: // It can happen that the ability hasn't been modified by a COST tag change, but that
				  // we know some modifiers apply to the hero. In this case, we show it
				  value.speed + (this.speedModifier?.value ?? 0);
		this.speedForDisplay = this.speed == null ? null : Math.max(0, this.speed);
		const influences = (this.speedModifier?.influences ?? [])
			.map((influence) => `${this.allCards.getCard(influence.cardId).name}: ${influence.value}`)
			.join('<br/> ');
		const baseSpeedText = this.i18n.translateString('mercenaries.team-widget.base-speed-text', {
			value: this.baseSpeed,
		});
		const influenceText = influences.length > 0 ? `<br />${baseSpeedText}<br />${influences}` : '';
		const speedModifierBaseText = !!this.speedModifier?.value
			? this.speed > this.baseSpeed
				? this.i18n.translateString('mercenaries.team-widget.speed-debuff', {
						value: Math.abs(this.speed - this.baseSpeed),
				  })
				: this.i18n.translateString('mercenaries.team-widget.speed-buff', {
						value: Math.abs(this.speed - this.baseSpeed),
				  })
			: null;
		this.speedModifierTooltip = speedModifierBaseText ? `${speedModifierBaseText}. ${influenceText}` : null;
	}

	type: 'ability' | 'equipment';
	cardId: string;
	cardImage: string;
	name: string;
	baseSpeed: number;
	speed: number;
	speedForDisplay: number;
	cooldown: number;
	cooldownLeft: number;
	isTreasure: boolean;
	totalUsed: number;
	speedModifier: BattleSpeedModifier;
	speedModifierTooltip: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	buildAbilityArtUrl(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

export interface Ability {
	readonly type: 'ability' | 'equipment';
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
	readonly speed: number;
	readonly cooldown: number;
	readonly cooldownLeft: number;
	readonly isTreasure: boolean;
	readonly totalUsed: number;
	readonly speedModifier: BattleSpeedModifier;
	readonly heroSpeedModifier: BattleSpeedModifier;
}
