import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeatureFlags } from '../../services/feature-flags';

declare let amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares" *ngIf="enabled">
			<twitter-share-button [onSocialClick]="onSocialClick"></twitter-share-button>
			<!-- <reddit-share-button [onSocialClick]="onSocialClick"></reddit-share-button> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: () => Promise<[string, any]>;

	enabled = FeatureFlags.ENABLE_BG_POSTMATCH_SHARE;
}
