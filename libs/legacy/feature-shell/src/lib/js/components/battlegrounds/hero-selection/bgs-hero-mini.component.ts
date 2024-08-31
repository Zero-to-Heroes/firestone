import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType, defaultStartingHp } from '@firestone-hs/reference-data';
import { BgsQuestStat } from '@firestone/battlegrounds/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsHeroSelectionTooltipComponent } from './bgs-hero-selection-tooltip.component';

@Component({
	selector: 'bgs-hero-mini',
	styleUrls: [`../../../../css/component/battlegrounds/hero-selection/bgs-hero-mini.component.scss`],
	template: `
		<div
			class="hero-mini"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="_hero"
			componentTooltipPosition="left"
		>
			<bgs-hero-portrait
				*ngIf="!isQuest"
				class="portrait"
				[heroCardId]="heroCardId"
				[health]="heroStartingHealth"
			></bgs-hero-portrait>
			<img *ngIf="isQuest" [src]="icon" class="icon" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroMiniComponent {
	componentType: ComponentType<BgsHeroSelectionTooltipComponent> = BgsHeroSelectionTooltipComponent;

	_hero: BgsMetaHeroStatTierItem | BgsQuestStat;
	icon: string;
	heroCardId: string;
	heroStartingHealth: number;
	isQuest: boolean;

	@Input() set hero(value: BgsMetaHeroStatTierItem | BgsQuestStat) {
		this._hero = value;
		this.heroCardId = value.id;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id, this.allCards);
		this.isQuest = !(value as BgsMetaHeroStatTierItem).heroPowerCardId;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.id}.jpg`;
	}

	constructor(private readonly allCards: CardsFacadeService) {}
}
