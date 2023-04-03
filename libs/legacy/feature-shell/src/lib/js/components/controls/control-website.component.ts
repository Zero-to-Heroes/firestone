import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'control-website',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-website.component.scss`,
	],
	template: `
		<a
			href="https://www.firestoneapp.gg"
			target="_blank"
			(mousedown)="preventMiddleClick($event)"
			(click)="preventMiddleClick($event)"
			(auxclick)="preventMiddleClick($event)"
			[attr.aria-label]="'Website'"
			inlineSVG="assets/svg/web.svg"
			[helpTooltip]="'app.global.controls.website-button-tooltip' | owTranslate"
		>
		</a>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlWebsiteComponent {
	preventMiddleClick(event: MouseEvent) {
		if (event.which === 2) {
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}
}
