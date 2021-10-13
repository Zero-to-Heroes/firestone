import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TagRole } from '@firestone-hs/reference-data';
import { BattleMercenary } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';

@Component({
	selector: 'mercenaries-team-mercenary',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-mercenary.component.scss',
	],
	template: `
		<div class="mercenary" [ngClass]="{ 'dead': isDead }">
			<div class="item header" [cardTooltip]="mercCardId" [cardTooltipPosition]="tooltipPosition">
				<!-- <div class="background-image" [style.background-image]="cardImage"></div> -->
				<!-- <div class="gradiant"></div> -->
				<div class="role-icon" *ngIf="roleIcon"><img [src]="roleIcon" /></div>
				<div class="name">
					<span>{{ name }}</span>
					<span class="level" *ngIf="level" helpTooltip="Current mercenary level">({{ level }})</span>
				</div>
			</div>
			<div
				class="ability item"
				*ngFor="let ability of abilities"
				[cardTooltip]="ability.cardId"
				[cardTooltipPosition]="tooltipPosition"
			>
				<div class="background-image" [style.background-image]="ability.cardImage"></div>
				<div class="gradiant"></div>
				<div class="ability-item-icon" [ngClass]="{ 'treasure': ability.isTreasure }">
					<img class="icon" [src]="buildAbilityArtUrl(ability.cardId)" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png?v=4"
					/>
				</div>
				<div class="name">
					<span>{{ ability.name }}</span>
				</div>
				<div
					class="cooldown-left"
					*ngIf="!!ability.cooldownLeft"
					helpTooltip="Turns left before that ability can be used again"
				>
					<img
						class="cooldown-icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png?v=3"
					/>
					<div class="value">{{ ability.cooldownLeft }}</div>
				</div>
				<div
					class="number-of-uses"
					*ngIf="ability.totalUsed > 0"
					helpTooltip="Number of times the mercenary has used this ability in this battle"
				>
					<span>{{ ability.totalUsed }}</span>
				</div>
			</div>
			<div
				class="equipment item"
				*ngIf="equipment?.cardId"
				[cardTooltip]="equipment.cardId"
				[cardTooltipPosition]="tooltipPosition"
			>
				<div class="background-image" [style.background-image]="equipment.cardImage"></div>
				<div class="gradiant"></div>
				<div class="equipment-item-icon" [cardTooltip]="equipment.cardId">
					<img class="icon" [src]="buildEquipmentArtUrl(equipment.cardId)" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png?v=3"
					/>
				</div>
				<div class="name">
					<span>{{ equipment.name }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamMercenaryComponent {
	@Input() tooltipPosition: boolean;
	@Input() set mercenary(value: BattleMercenary) {
		console.debug('set team', value);
		const refMercenaryCard = this.allCards.getCard(value.cardId);
		this.mercCardId = value.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value.cardId}.jpg?v=3)`;
		this.roleIcon =
			!value.role || value.role === TagRole[TagRole.NEUTRAL] || value.role === TagRole[TagRole.INVALID]
				? null
				: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_icon_golden_${value.role?.toLowerCase()}.png?v=2`;
		this.name = value.cardId ? refMercenaryCard.name ?? 'Unrecognized Mercernary' : 'Unknown Mercenary';
		this.level = value.level;
		this.abilities = (value.abilities ?? []).map((ability) => ({
			cardId: ability.cardId,
			cardImage: ability.isTreasure
				? `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_treasure_background.png?v=2)`
				: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_background.png?v=2)`,
			name: this.allCards.getCard(ability.cardId).name,
			speed: ability.speed,
			cooldown: ability.cooldown,
			cooldownLeft: ability.cooldownLeft,
			isTreasure: ability.isTreasure,
			totalUsed: ability.totalUsed,
		}));
		this.equipment = value.equipment
			? {
					cardId: value.equipment.cardId,
					cardImage: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_background.png?v=2)`,
					name: this.allCards.getCard(value.equipment.cardId).name,
			  }
			: null;
		this.isDead = value.isDead;
	}

	mercCardId: string;
	cardImage: string;
	roleIcon: string;
	name: string;
	level: number;
	abilities: readonly Ability[];
	equipment: Equipment;
	isDead: boolean;

	constructor(private readonly allCards: CardsFacadeService) {}

	buildAbilityArtUrl(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}

	buildEquipmentArtUrl(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

interface Ability {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
	readonly speed: number;
	readonly cooldown: number;
	readonly cooldownLeft: number;
	readonly isTreasure: boolean;
	readonly totalUsed: number;
}

interface Equipment {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
}
