import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { OverwolfService } from '../services/overwolf.service';

@Component({
	selector: 'version',
	styleUrls: [`../../css/component/version.component.scss`],
	template: ` <div class="version-info">v.{{ version }}</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionComponent implements AfterViewInit {
	version: string;

	constructor(private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.version = await this.ow.getManifest('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
