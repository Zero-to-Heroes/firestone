import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { GameState } from '../../../models/decktracker/game-state';
import { Events } from '../../../services/events.service';

import { default as fakeState } from './twitch/gameState.json';

@Component({
	selector: 'decktracker-overlay-standalone',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay-clean.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay-standalone.component.scss',
	],
	template: `
        <div class="root clean">
            <div class="decktracker-container">
                <div class="decktracker" *ngIf="gameState">
                    <decktracker-deck-list 
                            [deckState]="gameState.playerDeck"
                            [displayMode]="displayMode"
                            (onDisplayModeChanged)="onDisplayModeChanged($event)"
                            [activeTooltip]="activeTooltip">
                    </decktracker-deck-list>
                </div>
            </div>

            <i class="i-54 gold-theme corner top-left">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
                </svg>
            </i>
            <i class="i-54 gold-theme corner top-right">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
                </svg>
            </i>
            <i class="i-54 gold-theme corner bottom-right">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
                </svg>
            </i>
            <i class="i-54 gold-theme corner bottom-left">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
                </svg>
            </i>
            <tooltips [module]="'decktracker'"></tooltips>
        </div>
    `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayStandaloneComponent implements AfterViewInit {

    gameState: GameState;
    displayMode: string;
	activeTooltip: string;

	private showTooltipTimer;
    private hideTooltipTimer;
    
    private twitch;

	constructor(private cdr: ChangeDetectorRef, private events: Events, private http: HttpClient) {
		this.events.on(Events.DECK_SHOW_TOOLTIP).subscribe((data) => {
			clearTimeout(this.hideTooltipTimer);
			// Already in tooltip mode
			if (this.activeTooltip) {
				this.activeTooltip = data.data[0];
				this.events.broadcast(Events.SHOW_TOOLTIP, ...data.data);
				this.cdr.detectChanges();
			}
			else {
				this.showTooltipTimer = setTimeout(() => {
					this.activeTooltip = data.data[0];
					this.events.broadcast(Events.SHOW_TOOLTIP, ...data.data);
					this.cdr.detectChanges();
				}, 300)
			}
		});
		this.events.on(Events.DECK_HIDE_TOOLTIP).subscribe((data) => {
			clearTimeout(this.showTooltipTimer);
			this.hideTooltipTimer = setTimeout(() => {
				this.activeTooltip = undefined;
				this.events.broadcast(Events.HIDE_TOOLTIP, ...data.data);
				this.cdr.detectChanges();
			}, 200);
        });
        this.registerEbsListener();
	}

	ngAfterViewInit() {
        this.cdr.detach();
        this.twitch = (window as any).Twitch.ext;
        console.log('cached Twitch var', this.twitch);
        this.twitch.onContext((context) => this.twitch.rig.log('oncontext', context));
        this.twitch.onAuthorized((auth) => this.twitch.rig.log('on authorized', auth));
        this.twitch.listen('broadcast', (target, contentType, color) => {
            this.twitch.rig.log('Received broadcast event', target, contentType, color);
            console.log('Received broadcast event', target, contentType, color);
        });

        this.addDebugGameState();
		this.cdr.detectChanges();
    }

    private addDebugGameState() {
        this.displayMode = 'DISPLAY_MODE_GROUPED';
        this.gameState = (<any>fakeState);
        console.log('loaded fake state', this.gameState);
    }
    
    private registerEbsListener() {
        // this.twitch.rig.log('Registering ebs listener'); 
    }
}