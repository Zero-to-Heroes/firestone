import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MercenariesAction } from '../../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'mercenaries-action',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-ability.component.scss',
		'../../../../../css/component/mercenaries/overlay/action-queue/mercenaries-action.component.scss',
	],
	template: `
		<div class="item {{ side }}">
			<div class="action-order">{{ actionOrder }}</div>
			<div
				class="background-image"
				[style.background-image]="cardImage"
				[cardTooltip]="cardId"
				[cardTooltipPosition]="tooltipPosition"
			></div>
			<div class="gradiant"></div>
			<div class="portrait" [cardTooltip]="ownerCardId" [cardTooltipPosition]="tooltipPosition">
				<img class="icon" [src]="portraitUrl" />
			</div>
			<div
				class="item ability-speed"
				[ngClass]="{ 'buff': speed < baseSpeed, 'debuff': speed > baseSpeed }"
				*ngIf="speed != null"
				[helpTooltip]="speedModifierTooltip"
			>
				<div class="value">{{ speed }}</div>
				<img
					class="speed-icon"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_speed_icon.png"
				/>
			</div>
			<div class="name">
				<span>{{ name }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesActionComponent {
	@Input() tooltipPosition: boolean;

	@Input() set action(value: MercenariesAction) {
		const abilityCard = this.allCards.getCard(value.abilityCardId);
		this.actionOrder = (value as any).actionOrder;
		this.cardId = value.abilityCardId;
		this.ownerCardId = value.ownerCardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value.abilityCardId}.jpg)`;
		this.name = abilityCard.name;
		this.speed = value.speed != null ? Math.max(value.speed, 0) : null;
		this.side = value.side;
		this.portraitUrl = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.ownerCardId}.jpg`;
		this.frameUrl = `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${
			abilityCard.mercenaryRole ?? 'neutral'
		}.png`;
	}

	actionOrder: number;
	cardId: string;
	ownerCardId: string;
	cardImage: string;
	name: string;
	speed: number;
	portraitUrl: string;
	frameUrl: string;
	side: 'player' | 'opponent';

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}
}
