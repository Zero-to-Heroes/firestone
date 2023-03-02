import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { LocalizedBgsHeroCurve } from './bgs-strategies.component';

@Component({
	selector: 'bgs-strategy-curve',
	styleUrls: [`../../../../../css/component/battlegrounds/desktop/strategy/bgs-strategy-curve.component.scss`],
	template: `
		<div class="curve" *ngIf="curve.notes">
			<div class="title">{{ curve.name }}</div>
			<div class="notes">{{ curve.notes }}</div>
			<div class="steps">
				<div class="step" *ngFor="let step of curve.steps">
					<div class="background"></div>
					<div class="turn">
						<div class="number">{{ step.turnLabel }}</div>
						<div class="gold">{{ step.goldLabel }}</div>
					</div>
					<div class="actions">
						<div class="action" *ngFor="let action of step.localizedActions">{{ action }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategyCurveComponent {
	@Input() set config(value: LocalizedBgsHeroCurve) {
		this.curve = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	curve: LocalizedBgsHeroCurve;

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
