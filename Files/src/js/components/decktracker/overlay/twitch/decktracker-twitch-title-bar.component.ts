import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-twitch-title-bar',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#decktracker_logo"/>
				</svg>
            </i>
			<i class="copy-deckstring" (click)="copyDeckstring()" *ngIf="deckState.deckstring">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#checked_box"/>
				</svg>
            </i>            
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTwitchTitleBarComponent {

    @Input() deckState: DeckState;
    
    copyDeckstring() {
        (navigator as any).clipboard.writeText(this.deckState.deckstring);
        console.log('copied deckstring to clipboard', this.deckState.deckstring);
    }
}