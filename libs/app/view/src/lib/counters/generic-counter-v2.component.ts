import { ComponentType } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CounterInstance } from '@firestone/game-state';
import { CheckOffCardsListComponent } from './check-off-cards-list.component';

@Component({
	standalone: false,
	selector: 'generic-counter-v2',
	styleUrls: ['./generic-counter-v2.component.scss'],
	template: `
		<div
			class="counter generic-counter scalable {{ theme }} {{ side }}"
			[helpTooltip]="helpTooltipText"
			cardTooltip
			[cardTooltipRelatedCardIds]="cardTooltip"
			componentTooltip
			[componentType]="advancedTooltipType"
			[componentInput]="advancedTooltipInput"
			[componentTooltipPosition]="'left'"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value-container" *ngIf="value !== null && value !== undefined">
				<div class="value">{{ value }}</div>
			</div>
			<div class="value-img" *ngIf="valueImg !== null && valueImg !== undefined">
				<img class="image" [src]="valueImg" />
				<div class="frame"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericCountersV2Component {
	private static readonly COMPONENT_TYPE_MAP: Record<string, ComponentType<any>> = {
		CheckOffCardsListComponent: CheckOffCardsListComponent,
	};

	advancedTooltipType: ComponentType<any> | undefined;
	advancedTooltipInput: any | undefined;

	value: number | string | undefined | null;
	valueImg: string | undefined;
	cardTooltip: readonly string[] | undefined;
	image: string;
	helpTooltipText: string | null;
	theme: string;

	@Input() side: 'player' | 'opponent';

	@Input() set counter(value: CounterInstance<any>) {
		this.image = value.image;
		this.helpTooltipText = value.tooltip;
		this.value = value.value;
		this.valueImg = value.valueImg;
		this.cardTooltip = value.cardTooltip;
		this.theme = value.type === 'battlegrounds' ? 'battlegrounds-theme' : 'decktracker-theme';

		this.advancedTooltipType = value.advancedTooltipType
			? GenericCountersV2Component.COMPONENT_TYPE_MAP[value.advancedTooltipType]
			: undefined;
		this.advancedTooltipInput = value.advancedTooltipInput;
	}
}
