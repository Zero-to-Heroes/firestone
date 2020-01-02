import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'loading-state',
	styleUrls: [`../../css/component/loading-state.component.scss`],
	template: `
		<div class="loading-state">
			<div class="state-container">
				<div class="loading-icon" [inlineSVG]="'/Files/assets/svg/loading_state.svg'"></div>
				<span class="title">We're loading all the goods</span>
				<span class="subtitle">Please wait while we're collecting the information</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class LoadingStateComponent {}
