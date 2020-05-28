import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'loading-state',
	styleUrls: [`../../css/component/loading-state.component.scss`],
	template: `
		<div class="loading-state">
			<div class="state-container">
				<div class="loading-icon" [inlineSVG]="'/Files/assets/svg/loading_state.svg'"></div>
				<span class="title" *ngIf="title"> {{ title }} </span>
				<span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class LoadingStateComponent {
	@Input() title = "We're loading all the goods";
	@Input() subtitle = "Please wait while we're collecting the informatio";
}
