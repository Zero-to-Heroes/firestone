import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeatureFlags } from '../../services/feature-flags';

declare let amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<clipboard-share-button [onSocialClick]="onSocialClick" [page]="page"></clipboard-share-button>
			<twitter-share-button [onSocialClick]="onSocialClick" [page]="page"></twitter-share-button>
			<reddit-share-button
				[onSocialClick]="onSocialClick"
				[page]="page"
				*ngIf="enableRedditShare"
			></reddit-share-button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: (copyToCliboard: boolean) => Promise<[string, any]>;
	@Input() page = 'bgs-post-match-stats';

	enableRedditShare = FeatureFlags.ENABLE_REDDIT_SHARE;
	enableClipboardShare = FeatureFlags.ENABLE_CLIPBOARD_SHARE;
}
