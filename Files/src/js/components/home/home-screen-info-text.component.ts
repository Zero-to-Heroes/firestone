import { Component, NgZone, OnInit } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'home-screen-info-text',
	styleUrls: [`../../../css/component/home/home-screen-info-text.component.scss`],
	template: `
		<div class="home-screen-info">
			<div class="hearthlore">
				<span>Hearthlore</span>
			</div>

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
