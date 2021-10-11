import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattleMercenary } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';

@Component({
	selector: 'mercenaries-team-mercenary',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-mercenary.component.scss',
	],
	template: `
		<div class="mercenary">
			<div class="item header" [cardTooltip]="mercCardId">
				<!-- <div class="background-image" [style.background-image]="cardImage"></div> -->
				<!-- <div class="gradiant"></div> -->
				<div class="role-icon"><img [src]="roleIcon" /></div>
				<div class="name">
					<span>{{ name }}</span>
				</div>
				<div class="level" *ngIf="level">{{ level }}</div>
			</div>
			<div class="ability item" *ngFor="let ability of abilities" [cardTooltip]="ability.cardId">
				<div class="background-image" [style.background-image]="ability.cardImage"></div>
				<div class="gradiant"></div>
				<div class="ability-item-icon">
					<img class="icon" [src]="buildAbilityArtUrl(ability.cardId)" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png?v=4"
					/>
					<div class="speed">
						<div class="value">{{ ability.speed }}</div>
					</div>
					<div class="cooldown" *ngIf="!!ability.cooldown">
						<img
							class="cooldown-icon"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png?v=3"
						/>
						<div class="value">{{ ability.cooldown }}</div>
					</div>
				</div>
				<div class="name">
					<span>{{ ability.name }}</span>
				</div>
			</div>
			<div class="equipment item" *ngIf="equipment" [cardTooltip]="equipment.cardId">
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
	@Input() set mercenary(value: BattleMercenary) {
		console.debug('set team', value);
		const refMercenaryCard = this.allCards.getCard(value.cardId);
		this.mercCardId = value.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value.cardId}.jpg?v=3)`;
		this.roleIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_icon_golden_${value.role?.toLowerCase()}.png?v=2`;
		this.name = refMercenaryCard.name;
		this.level = value.level;
		this.abilities = value.abilities.map((ability) => ({
			cardId: ability.cardId,
			cardImage: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_background.png?v=2)`,
			name: this.allCards.getCard(ability.cardId).name,
			speed: ability.speed,
			cooldown: ability.cooldown,
		}));
		this.equipment = value.equipment
			? {
					cardId: value.equipment.cardId,
					cardImage: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_background.png?v=2)`,
					name: this.allCards.getCard(value.equipment.cardId).name,
			  }
			: null;
	}

	mercCardId: string;
	cardImage: string;
	roleIcon: string;
	name: string;
	level: number;
	abilities: readonly Ability[];
	equipment: Equipment;

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
}

interface Equipment {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
}
