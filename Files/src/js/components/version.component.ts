import { Component, NgZone, OnInit } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'version',
	styleUrls: [`../../css/component/version.component.scss`],
	template: `
		<div class="version-info">v.{{version}}</div>
	`,
})

export class VersionComponent implements OnInit {

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
