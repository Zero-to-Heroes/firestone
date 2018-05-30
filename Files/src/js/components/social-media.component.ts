import { Component } from '@angular/core';

@Component({
	selector: 'social-media',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/social-media.component.scss`,
	],
	template: `
		<div class="social-media">
			<button class="i-30 pale-theme social-button" (click)="openReddit()">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#reddit"/>
				</svg>
			</button>

			<button class="i-30 pale-theme social-button" (click)="openGitHub()">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#github"/>
				</svg>
			</button>
		</div>
	`,
})

export class SocialMediaComponent {

	private openReddit() {
		window.open('https://www.reddit.com/r/firestoneapp/');
	}

	private openGitHub() {
		window.open('https://github.com/Zero-to-Heroes/firestone/');
	}
}
