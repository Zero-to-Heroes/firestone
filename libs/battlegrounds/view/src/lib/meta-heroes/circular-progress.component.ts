/* eslint-disable no-mixed-spaces-and-tabs */
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';

// TODO: this should be moved to a more common module
@Component({
	selector: 'circular-progress',
	styleUrls: [`./circular-progress.component.scss`],
	template: `
		<div class="container">
			<img [src]="imageUrl" />
			<svg viewBox="0 0 200 200">
				<circle class="circle-backdrop" cx="100" cy="100" r="94"></circle>
				<circle #circleProgress class="circle-progress" cx="100" cy="100" r="94"></circle>
			</svg>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircularProgressComponent implements AfterViewInit {
	@Input() completionRate = 0;
	@Input() imageUrl: string;

	@ViewChild('circleProgress') circleProgressElement!: ElementRef<SVGElement>;

	ngAfterViewInit(): void {
		this.setCompletionRate(this.completionRate);
	}

	// Value between 0 and 100
	setCompletionRate(completionRate: number): void {
		const circleProgressElement = this.circleProgressElement.nativeElement;
		const radius = Number(circleProgressElement.getAttribute('r'));
		const circumference = 2 * Math.PI * radius;
		// offset == 0 is fully completed, offset == circumference is not started
		const offset = ((100 - completionRate) / 100) * circumference;
		circleProgressElement.style.strokeDasharray = `${circumference} ${circumference}`;
		circleProgressElement.style.strokeDashoffset = `${offset}`;
	}
}
