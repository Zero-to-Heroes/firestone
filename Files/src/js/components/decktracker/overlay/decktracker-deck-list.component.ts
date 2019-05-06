import { Component, ChangeDetectionStrategy, Input, HostListener, ElementRef, AfterViewInit, ViewRef, ChangeDetectorRef } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { IOption } from 'ng-select';
import { PreferencesService } from '../../../services/preferences.service';
import { Events } from '../../../services/events.service';

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<div class="deck-list" (scroll)="onScroll($event)">
			<div class="select-container">
				<ng-select
						class="display-mode-select"
						[options]="displayModeSelectOptions"
						(opened)="refresh()"
						(closed)="refresh()"
						(selected)="selectDisplayMode($event)"
						[(ngModel)]="displayMode">
					<ng-template #optionTemplate let-option="option">
						<span>{{option?.label}}</span>
						<i class="i-30" *ngIf="option.value == displayMode">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown"/>
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<div class="dim-overlay" *ngIf="activeTooltip"></div>
			</div>
			<ng-container [ngSwitch]="displayMode">
				<deck-list-by-zone *ngSwitchCase="'DISPLAY_MODE_ZONE'" 
					[deckState]="_deckState"
					[activeTooltip]="activeTooltip">
				</deck-list-by-zone>
				<grouped-deck-list *ngSwitchCase="'DISPLAY_MODE_GROUPED'" 
					[deckState]="_deckState"
					[activeTooltip]="activeTooltip">
				</grouped-deck-list>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent implements AfterViewInit {

	@Input() activeTooltip: string;
	@Input() displayMode: string;
	_deckState: DeckState;
	
	displayModeSelectOptions: Array<IOption> = [
		{label: 'Card location', value: 'DISPLAY_MODE_ZONE'},
		{label: 'Focus on deck', value: 'DISPLAY_MODE_GROUPED'},
	]

	constructor(
            private el: ElementRef, 
            private cdr: ChangeDetectorRef, 
            private events: Events,
            private prefs: PreferencesService) { }

	async ngAfterViewInit() {
		let singleEl: HTMLElement = this.el.nativeElement.querySelector('.single');
		let caretEl = singleEl.appendChild(document.createElement('i'));
		caretEl.innerHTML =
			`<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
			</svg>`;
		caretEl.classList.add('i-30');
		caretEl.classList.add('caret');
		setTimeout(() => {
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
        });
	}

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
	}

	selectDisplayMode(option: IOption) {
		console.log('changing display mode', option);
		this.prefs.setOverlayDisplayMode(option.value);
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.deck-list').getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
    }
    
    onScroll(event) {
        console.log('scrolling');
        // Force immediate clean of the tooltip
		this.events.broadcast(Events.DECK_HIDE_TOOLTIP, 0);        
    }

	refresh() {
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}