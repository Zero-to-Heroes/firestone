import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'copy-deckstring',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/copy-deckstring.component.scss',
	],
	template: `
		<div
			class="copy-deckstring"
			(mousedown)="copyDeckstring()"
			[helpTooltip]="showTooltip ? copyText : null"
			[bindTooltipToGameWindow]="showTooltip ? true : null"
		>
			<svg class="svg-icon-fill">
				<use xlink:href="assets/svg/sprite.svg#copy_deckstring" />
			</svg>
		</div>
		<div class="message" *ngIf="!showTooltip || title">{{ title || copyText }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyDesckstringComponent {
	@Input() deckstring: string;
	@Input() copyText: string;
	@Input() showTooltip: boolean;
	@Input() title: string;

	private inputCopy: string;

	constructor(private readonly cdr: ChangeDetectorRef, @Optional() private readonly ow: OverwolfService) {}

	async copyDeckstring() {
		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, not copying to clipboard');
			return;
		}
		this.ow.placeOnClipboard(this.deckstring);
		this.inputCopy = this.copyText;
		this.copyText = 'Copied!';
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}
}
