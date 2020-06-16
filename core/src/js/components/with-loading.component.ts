import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'with-loading',
	styleUrls: [`../../css/global/reset-styles.scss`, `../../css/component/with-loading.component.scss`],
	template: `
		<ng-container class="with-loading">
			<ng-container *ngIf="!isLoading" [@fadeInOut]>
				<ng-content></ng-content>
			</ng-container>
			<loading-state
				*ngIf="isLoading"
				[mainTitle]="mainTitle"
				[subtitle]="subtitle"
				[hint]="hint"
				[svgName]="svgName"
				[@fadeInOut]
			></loading-state>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('fadeInOut', [
			state(
				'void',
				style({
					opacity: 0,
				}),
			),
			transition('void <=> *', animate(300)),
		]),
	],
})
export class WithLoadingComponent {
	@Input() isLoading: boolean;
	@Input() mainTitle = "We're loading all the goods";
	@Input() subtitle = "Please wait while we're collecting the information";
	@Input() hint: boolean;
	@Input() svgName: string;
}
