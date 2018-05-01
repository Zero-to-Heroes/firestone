import { Component, NgZone, OnInit } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'home-screen-info-text',
	styleUrls: [`../../../css/component/home/home-screen-info-text.component.scss`],
	template: `
		<div class="home-screen-info">
			<div class="hearthlore">
				<i class="i-35 gold-theme left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
				<span class="title">Welcome to Hearthlore</span>
				<i class="i-35 gold-theme right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
			</div>
			<span class="sub-title">No Hearthstone session detected: <br /> Choose an ability:</span>
		</div>
	`,
})

export class HomeScreenInfoTextComponent implements OnInit {

	private version;

	constructor(private ngZone: NgZone) {

	}

	ngOnInit() {
		overwolf.extensions.getManifest('dikgmjhafcjcgdpoakplhfjcjhfpdfkjgihpcjfh', (result) => {
			console.log('retrieved manifest', result);
			this.ngZone.run(() => {
				this.version = result.meta.version;
			});
		})
	}
}
