import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
	selector: 'social-media',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/social-media.component.scss`,
	],
	template: `
		<div class="social-media">
			<button class="i-30 pale-theme social-button" (mousedown)="openReddit()">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#reddit"/>
				</svg>
			</button>

			<button class="i-30 pale-theme social-button" (mousedown)="openGitHub()">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#github"/>
				</svg>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SocialMediaComponent implements AfterViewInit {

	constructor(private cdr: ChangeDetectorRef) {

	} 
	
	ngAfterViewInit() {
		this.cdr.detach();
	}

	openReddit() {
		window.open('https://www.reddit.com/r/firestoneapp/');
	}

	openGitHub() {
		window.open('https://github.com/Zero-to-Heroes/firestone/');
	}
}
