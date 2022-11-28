import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
	selector: 'control-help',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-help.component.scss`,
	],
	template: `
		<button
			(mousedown)="showHelp()"
			[helpTooltip]="'app.global.controls.help-button-tooltip' | owTranslate"
			[attr.aria-label]="'app.global.controls.help-button-tooltip' | owTranslate"
		>
			<svg class="svg-icon-fill">
				<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#help"></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlHelpComponent {
	@Output() help: EventEmitter<boolean> = new EventEmitter<boolean>();

	showHelp() {
		this.help.next(true);
	}
}
