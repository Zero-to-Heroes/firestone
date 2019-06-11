import { Component, Input, HostBinding, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';
import { ViewContainerRef, ViewChild, ComponentFactoryResolver, ViewEncapsulation } from '@angular/core';

import { Events } from '../services/events.service';
import { Preferences } from '../models/preferences';
import { PreferencesService } from '../services/preferences.service';

@Component({
  	selector: 'ftue-element',
	styleUrls: [`../../css/component/ftue-element.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
        <div class="ftue-element {{placement}}" *ngIf="text">
            <span class="ftue-title" [innerHTML]="title"></span>
            <p [innerHTML]="text"></p>
            <button class="confirm" (mousedown)="dismissFtue()">{{buttonText}}</button>        
            <svg class="ftue-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                <polygon points="0,0 8,-9 16,0"/>
            </svg>
        </div>
    `,
	// I don't know how to make this work with OnPush
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FtueElement {

	@Input() title: string;
	@Input() text: string;
	@Input() buttonText: string;
	@Input() placement: string;

	@HostBinding('style.left') left: string;
	@HostBinding('style.top') top: string;
	@HostBinding('style.position') position: string;
    @HostBinding('style.display') display: string;

    constructor(private events: Events) {

    }
    
    dismissFtue() {
        this.events.broadcast(Events.DISMISS_FTUE);
    }
}

@Component({
	selector: 'ftue',
	styleUrls: [`../../css/component/ftue.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
        <div class="ftue">
            <ng-template #ftue>
        </ng-template></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FtueComponent implements AfterViewInit {

    @ViewChild('ftue', { read: ViewContainerRef }) ftue: ViewContainerRef;
    ftueElement;
    
    private showingPityTimerFtue: boolean = false;

	constructor(
		private events: Events,
		private cdr: ChangeDetectorRef,
        private resolver: ComponentFactoryResolver,
        private preferences: PreferencesService) {

		this.events.on(Events.SET_MOUSE_OVER).subscribe((data) => this.handleSetMouseOver(data));
		this.events.on(Events.DISMISS_FTUE).subscribe(() => this.destroy());
		this.events.on(Events.FORMAT_SELECTED).subscribe(() => this.events.broadcast(Events.DISMISS_FTUE));
		// this.events.on(Events.MODULE_SELECTED).subscribe(() => this.events.broadcast(Events.DISMISS_FTUE));
		// this.events.on(Events.SHOW_CARDS).subscribe(() => this.events.broadcast(Events.DISMISS_FTUE));
		this.events.on(Events.SET_SELECTED).subscribe(() => this.events.broadcast(Events.DISMISS_FTUE));
		// this.events.on(Events.SHOW_CARD_MODAL).subscribe(() => this.events.broadcast(Events.DISMISS_FTUE));
	}

	ngAfterViewInit() {
		this.cdr.detach();
		// https://blog.angularindepth.com/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error-e3fd9ce7dbb4
		setTimeout(() => {
		    // We create a factory out of the component we want to create
		    let factory = this.resolver.resolveComponentFactory(FtueElement);

		    // We create the component using the factory and the injector
		    this.ftueElement = this.ftue.createComponent(factory);
		})
    }
    
    private async handleSetMouseOver(data) {
        const userPrefs: Preferences = await this.preferences.getPreferences();
        if (!userPrefs.hasSeenPityTimerFtue && !this.showingPityTimerFtue) {
            this.showingPityTimerFtue = true;
            this.destroy();

            const rect: any = data.data[0];
            let left: number = rect.left - 215;
            this.ftueElement.instance.placement = 'left';
            if (left < 20) {
                left = rect.right + 5;
                this.ftueElement.instance.placement = 'right';
            }
            // TODO: I think this comes from the window invisible borders, to be checked
            const top: number = rect.top - 10;

            this.ftueElement.instance.display = 'flex';
            this.ftueElement.instance.left = left + 'px';
            this.ftueElement.instance.top = top + 'px';
            this.ftueElement.instance.position = 'absolute';

            this.ftueElement.instance.removing = false;
            this.ftueElement.instance.title = `We've added Pity Timers!`;
            this.ftueElement.instance.text = `You can see when is your next legendary and epic scheduled for every set.
             Have fun!`;
            this.ftueElement.instance.buttonText = `Got it`;
            this.events.broadcast(Events.SHOWING_FTUE, data.data[1]);
            if (!(<ViewRef>this.cdr).destroyed) {
                this.cdr.detectChanges();
            }
            this.updatePreferences();
        }
    }

	private destroy() {
        this.showingPityTimerFtue = false;
		if (this.ftueElement && this.ftueElement.instance.display !== 'none') {
			this.ftueElement.instance.display = 'none';
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}
    }
    
    private updatePreferences() {
        this.preferences.setHasSeenPityTimerFtue(true);
    }
}
