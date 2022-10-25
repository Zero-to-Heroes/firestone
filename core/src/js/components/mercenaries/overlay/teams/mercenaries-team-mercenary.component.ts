import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { TagRole, Zone } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattleMercenary } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { isPassiveMercsTreasure } from '../../../../services/mercenaries/mercenaries-utils';
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
					<span
						class="level"
						*ngIf="level"
						[helpTooltip]="'mercenaries.team-widget.merc-level-tooltip' | owTranslate"
						>({{ level }})</span
					>
				</div>
			</div>
			<mercenaries-team-ability
				class="ability"
				*ngFor="let ability of abilities"
				[ability]="ability"
				[tooltipPosition]="tooltipPosition"
				[enableHighlight]="enableHighlight"
				[uncapacitated]="isDead || isBench"
			></mercenaries-team-ability>
			<mercenaries-team-ability
				*ngIf="equipment?.cardId"
				class="equipment"
				[ability]="equipment"
				[tooltipPosition]="tooltipPosition"
				[enableHighlight]="enableHighlight"
				[uncapacitated]="isDead || isBench"
			></mercenaries-team-ability>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamMercenaryComponent {
	@Input() tooltipPosition: boolean;
	@Input() enableHighlight: boolean;

	@Input() set mercenary(value: BattleMercenary) {
		const refMercenaryCard = this.allCards.getCard(value.cardId);
		this.mercCardId = value.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value.cardId}.jpg)`;
		this.roleIcon =
			!value.role || value.role === TagRole[TagRole.INVALID]
				? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_icon_golden_neutral.png`
				: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_icon_golden_${value.role?.toLowerCase()}.png`;
		this.name = value.cardId
			? refMercenaryCard.name ?? this.i18n.translateString('mercenaries.team-widget.unrecognized-mercenary')
			: this.i18n.translateString('mercenaries.team-widget.unknown-mercenary');
		this.level = value.level;
		this.abilities = (value.abilities ?? []).map((ability) => {
			const abilityCard = this.allCards.getCard(ability.cardId);
			console.debug('[ability] ability', ability, abilityCard);
			return {
				type: 'ability',
				cardId: ability.cardId,
				cardImage: ability.isTreasure
					? `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_treasure_background.png)`
					: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_background.png)`,
				name: abilityCard.name,
				speed: isPassiveMercsTreasure(ability.cardId, this.allCards)
					? null
					: ability.speed ?? abilityCard.cost ?? 0,
				cooldown: ability.cooldown ?? abilityCard.mercenaryAbilityCooldown,
				cooldownLeft: ability.cooldownLeft,
				isTreasure: ability.isTreasure,
				totalUsed: ability.totalUsed,
				speedModifier: ability.speedModifier,
				heroSpeedModifier: value.speedModifier,
			};
		});
		this.equipment = value.equipment
			? ({
					type: 'equipment',
					cardId: value.equipment.cardId,
					cardImage: `url(https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_background.png)`,
					name: this.allCards.getCard(value.equipment.cardId).name,
			  } as Ability)
			: null;
		this.isDead = value.isDead;
		this.isBench = value.zone === Zone.SETASIDE;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
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

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}
}
