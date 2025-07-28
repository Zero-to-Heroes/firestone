import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '../localization/localization.service';

@Component({
	selector: 'with-loading',
	styleUrls: [`./with-loading.component.scss`],
	standalone: false,
	template: `
		<ng-container>
			<ng-container *ngIf="!isLoading">
				<ng-content [@fadeInOut]></ng-content>
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
	// encapsulation: ViewEncapsulation.None,
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
	@Input() isLoading: boolean | null;
	@Input() mainTitle = this.i18n.translateString('app.loading.title');
	@Input() subtitle = this.i18n.translateString('app.loading.subtitle');
	@Input() hint: boolean;
	@Input() svgName: string;

	constructor(private readonly i18n: ILocalizationService) {}
}
