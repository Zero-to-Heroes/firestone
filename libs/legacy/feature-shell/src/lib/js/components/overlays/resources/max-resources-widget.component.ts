import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MaxResources } from './model';

@Component({
	selector: 'max-resources-widget',
	styleUrls: ['./max-resources-widget.component.scss'],
	template: `
		<div class="max-resources" *ngIf="maxResources">
			<div class="info health" *ngIf="maxResources.health" [helpTooltip]="'Max health'">
				<div class="icon-container">
					<img
						class="icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/health.png"
					/>
				</div>
				<div class="value">{{ maxResources.health }}</div>
			</div>
			<div class="info mana" *ngIf="maxResources.mana" [helpTooltip]="'Max mana'">
				<div class="icon-container">
					<img class="icon" src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana.png" />
				</div>
				<div class="value">{{ maxResources.mana }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaxResourcesWidgetComponent {
	@Input() maxResources: MaxResources | null;
}
