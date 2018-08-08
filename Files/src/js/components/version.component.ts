import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'version',
	styleUrls: [`../../css/component/version.component.scss`],
	template: `
		<div class="version-info">v.{{version}}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class VersionComponent implements AfterViewInit {

	version: string;

	constructor(private cdr: ChangeDetectorRef) {

	}

	ngAfterViewInit() {
		this.cdr.detach();
		overwolf.extensions.getManifest('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob', (result) => {
			// console.log('retrieved manifest', result);
			this.version = result.meta.version;
			this.cdr.detectChanges();
		})
	}
}
