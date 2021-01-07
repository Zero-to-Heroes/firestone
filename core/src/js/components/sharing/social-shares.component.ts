import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeatureFlags } from '../../services/feature-flags';

declare let amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<twitter-share-button [onSocialClick]="onSocialClick"></twitter-share-button>
			<reddit-share-button [onSocialClick]="onSocialClick" *ngIf="enableRedditShare"></reddit-share-button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: () => Promise<[string, any]>;

	enableRedditShare = FeatureFlags.ENABLE_BG_POSTMATCH_SHARE_REDDIT;
}
