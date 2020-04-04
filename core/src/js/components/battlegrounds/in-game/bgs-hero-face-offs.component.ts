import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpponentFaceOff } from './opponent-face-off';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-face-offs',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-hero-face-offs.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="face-offs">
			<div class="header entry">
				<div class="hero">Hero</div>
				<div class="won">Won</div>
				<div class="lost">Lost</div>
				<div class="tied">Tied</div>
			</div>
			<bgs-hero-face-off *ngFor="let faceOff of opponentFaceOffs" [faceOff]="faceOff"></bgs-hero-face-off>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffsComponent {
	@Input() opponentFaceOffs: readonly OpponentFaceOff[];
}
