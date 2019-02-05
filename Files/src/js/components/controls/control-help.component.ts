import { Component, ViewEncapsulation, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

declare var overwolf: any;
declare var Crate: any;

@Component({
	selector: 'control-help',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-help.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<button class="i-30 pink-button" (click)="contactSupport()">
			<svg class="svg-icon-fill">
				<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_support"></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlHelpComponent implements AfterViewInit {

	private crate;

	ngAfterViewInit() {
		if (!Crate) {
			setTimeout(() => {
				this.ngAfterViewInit();
			}, 20);
			return;
		}
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				this.initCrate();
			}
		});
	}

	contactSupport() {
		this.initCrate();
		this.crate.toggle();
		this.crate.show();
	}
	 
	private initCrate() {
		if (this.crate) {
			return;
		}
		console.log('initializing Crate');
		this.crate = new Crate({
			server:"187101197767933952",
			channel:"446045705392357376",
			shard: 'https://cl2.widgetbot.io'
		});
		this.crate.store.subscribe(() => {
			if (this.crate.store.getState().visible && !this.crate.store.getState().open) {
				this.crate.hide();
			}
		});
		this.crate.hide();
	}
}
