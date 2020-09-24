import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

declare var amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<twitter-share-button [onSocialClick]="onSocialClick"></twitter-share-button>

			<!--<div class="social-share discord disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#discord_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share youtube disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#youtube_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share gfycat disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#gfycat_share"/>
                    </svg>
                </i>
            </div>-->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent {
	@Input() onSocialClick: () => Promise<[string, any]>;
}
