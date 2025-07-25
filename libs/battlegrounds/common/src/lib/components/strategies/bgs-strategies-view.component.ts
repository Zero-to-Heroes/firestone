import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Strategy } from '../../models/strategies';
import { BgsStrategyCurveComponent } from './bgs-strategy-curve.component';

@Component({
	standalone: false,
	selector: 'bgs-strategies-view',
	styleUrls: [`./bgs-strategies.component.scss`],
	template: `
		<div class="strategies" *ngIf="strategies">
			<div class="strategy" *ngFor="let strat of strategies">
				<div class="summary">
					<div class="background"></div>
					<blockquote class="text" [innerHTML]="strat.summary"></blockquote>
					<div class="curves" *ngIf="strat.curves?.length">
						<div class="label" [fsTranslate]="'app.battlegrounds.strategies.curve-label'"></div>
						<div
							class="curve"
							*ngFor="let curve of strat.curves"
							componentTooltip
							[componentType]="componentType"
							[componentInput]="curve"
						>
							{{ curve.name }}
						</div>
					</div>
				</div>
				<div class="author">
					<div class="name" [helpTooltip]="strat.author?.tooltip" *ngIf="!strat.author?.link">
						{{ strat.author?.name }}
					</div>
					<a
						class="name"
						[helpTooltip]="strat.author?.tooltip"
						*ngIf="strat.author?.link"
						href="{{ strat.author?.link }}"
						target="_blank"
						>{{ strat.author?.name }}</a
					>
					<div class="date">{{ strat.date }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategiesViewComponent {
	componentType: ComponentType<BgsStrategyCurveComponent> = BgsStrategyCurveComponent;

	@Input() strategies: readonly Strategy[] | null;
}
