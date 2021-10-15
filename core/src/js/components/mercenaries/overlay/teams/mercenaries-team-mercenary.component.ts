import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TagRole, Zone } from '@firestone-hs/reference-data';
import { BattleMercenary } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { Ability } from './mercenaries-team-ability.component';

@Component({
	selector: 'mercenaries-team-mercenary',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/directive/mercenaries-highlight.directive.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-mercenary.component.scss',
	],
	template: `
		<div class="mercenary" [ngClass]="{ 'dead': isDead, 'bench': isBench }">
			<div
				class="item header"
				[cardTooltip]="mercCardId"
				[cardTooltipPosition]="tooltipPosition"
				[mercenariesHighlight]="mercCardId"
			>
				<div class="role-icon" *ngIf="roleIcon"><img [src]="roleIcon" /></div>
				<div class="name">
					<span>{{ name }}</span>
					<span class="level" *ngIf="level" helpTooltip="Current mercenary level">({{ level }})</span>
				</div>
			</div>
			<mercenaries-team-ability
				class="ability"
				*ngFor="let ability of abilities"
				[ability]="ability"
				[tooltipPosition]="tooltipPosition"
			></mercenaries-team-ability>
			<mercenaries-team-ability
				*ngIf="equipment?.cardId"
				class="equipment"
				[ability]="equipment"
				[tooltipPosition]="tooltipPosition"
			></mercenaries-team-ability>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamMercenaryComponent {
	@Input() tooltipPosition: boolean;

	@Input() set mercenary(value: BattleMercenary) {
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
			type: 'ability',
		}));
		this.equipment = value.equipment
			? ({
					cardId: value.equipment.cardId,
					cardImage: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_background.png?v=2)`,
					name: this.allCards.getCard(value.equipment.cardId).name,
			  } as Ability)
			: null;
		this.isDead = value.isDead;
		this.isBench = value.zone === Zone.SETASIDE;
	}

	mercCardId: string;
	cardImage: string;
	roleIcon: string;
	name: string;
	level: number;
	abilities: readonly Ability[];
	equipment: Ability;
	isDead: boolean;
	isBench: boolean;

	constructor(private readonly allCards: CardsFacadeService) {}
}
