import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

declare var amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<twitter-share-button [onSocialClick]="onSocialClick"></twitter-share-button>
			<reddit-share-button [onSocialClick]="onSocialClick"></reddit-share-button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: () => Promise<[string, any]>;
}
