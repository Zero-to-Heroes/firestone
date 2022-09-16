import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsHeroStat, BgsQuestStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { defaultStartingHp } from '../../../services/hs-utils';
import { BgsHeroSelectionTooltipComponent } from './bgs-hero-selection-tooltip.component';

@Component({
	selector: 'bgs-hero-mini',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-mini.component.scss`,
	],
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
	componentType: ComponentType<any> = BgsHeroSelectionTooltipComponent;

	_hero: BgsHeroStat | BgsQuestStat;
	icon: string;
	heroCardId: string;
	heroStartingHealth: number;
	isQuest: boolean;

	@Input() set hero(value: BgsHeroStat | BgsQuestStat) {
		this._hero = value;
		this.heroCardId = value.id;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id);
		this.isQuest = !(value as BgsHeroStat).heroPowerCardId;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.id}.jpg`;
	}
}
