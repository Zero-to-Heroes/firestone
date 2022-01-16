import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'control-share',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-share.component.scss`,
	],
	template: `
		<button class="button-container">
			<div class="icon" inlineSVG="assets/svg/social/share.svg"></div>
			<div class="share-container">
				<div class="header" [owTranslate]="'app.share.title'"></div>
				<social-shares
					class="social-shares"
					[onSocialClick]="onSocialClick"
					[page]="page"
					[showLabel]="true"
				></social-shares>
			</div>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlShareComponent {
	@Input() onSocialClick: (copyToCliboard: boolean) => Promise<[string, any]>;
	@Input() page = 'bgs-post-match-stats';
}
