import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'lottery-window',
	styleUrls: [
		`../../../css/themes/general-theme.scss`,
		'../../../css/component/lottery/lottery-window.component.scss',
	],
	template: `<div class="overlay-container-parent general-theme">
		<lottery class="widget"></lottery>
	</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryWindowComponent implements AfterViewInit {
	private windowId: string;

	constructor(private readonly ow: OverwolfService) {}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.windowId);
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;
	}
}
