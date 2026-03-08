import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<clipboard-share-button
				class="social-share-button"
				[onSocialClick]="onSocialClick"
				[page]="page"
				[showLabel]="showLabel"
			></clipboard-share-button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: (copyToCliboard: boolean) => Promise<[string, any]>;
	@Input() page = 'bgs-post-match-stats';
	@Input() showLabel: boolean;
}
