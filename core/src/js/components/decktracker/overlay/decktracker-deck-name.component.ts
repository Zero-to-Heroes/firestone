import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-name',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-name.component.scss',
	],
	template: `
		<div class="deck-name">
			<span class="name" [helpTooltip]="deckName" [bindTooltipToGameWindow]="true">{{ deckName }}</span>
			<div
				*ngIf="deckstring"
				class="copy-deckstring"
				(mousedown)="copyDeckstring()"
				[helpTooltip]="copyText"
				[bindTooltipToGameWindow]="true"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#copy_deckstring" />
				</svg>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckNameComponent {
	deckName: string;
	deckstring: string;
	copyText: string;

	@Input() set deck(value: DeckState) {
		this.deckName = value.name || (value.hero ? value.hero.playerName || value.hero.name : 'Unnamed deck');
		this.deckstring = value.deckstring;
		this.copyText = 'Copy deck';
	}

	constructor(private readonly cdr: ChangeDetectorRef, @Optional() private readonly ow: OverwolfService) {}

	async copyDeckstring() {
		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, not copying to clipboard');
			return;
		}
		this.ow.placeOnClipboard(this.deckstring);
		this.copyText = 'Copied!';
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = 'Copy deck';
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}
}
