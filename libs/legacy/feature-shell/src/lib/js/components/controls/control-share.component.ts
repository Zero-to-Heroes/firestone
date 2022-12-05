import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'control-share',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-share.component.scss`,
	],
	template: `
		<!-- TODO: remove -1 tabindex once the menu is converted to using ngIf instead of CSS -->
		<button class="button-container" tabindex="-1" [attr.aria-label]="'Social share'">
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
