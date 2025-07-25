import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MaxResources } from './model';

@Component({
	standalone: false,
	selector: 'max-resources-widget',
	styleUrls: ['./max-resources-widget.component.scss'],
	template: `
		<div class="max-resources" *ngIf="maxResources" [ngClass]="{ horizontal: showHorizontally }">
			<div
				class="info health"
				*ngIf="maxResources.health"
				[helpTooltip]="'widgets.max-resources.max-health-tooltip' | fsTranslate"
			>
				<div class="icon-container">
					<img
						class="icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/health.png"
					/>
				</div>
				<div class="value">{{ maxResources.health }}</div>
			</div>
			<div
				class="info mana"
				*ngIf="maxResources.mana"
				[helpTooltip]="'widgets.max-resources.max-mana-tooltip' | fsTranslate"
			>
				<div class="icon-container">
					<img class="icon" src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana.png" />
				</div>
				<div class="value">{{ maxResources.mana }}</div>
			</div>
			<div
				class="info coins"
				*ngIf="maxResources.coins"
				[helpTooltip]="'widgets.max-resources.max-coins-tooltip' | fsTranslate"
			>
				<div class="icon-container">
					<img
						class="icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/coin_mana.png"
					/>
				</div>
				<div class="value">{{ maxResources.coins }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaxResourcesWidgetComponent {
	@Input() showHorizontally: boolean | null;
	@Input() maxResources: MaxResources | null;
}
