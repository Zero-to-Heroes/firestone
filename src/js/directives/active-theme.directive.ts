import { Directive, HostBinding, Input } from '@angular/core';
import { CurrentAppType } from '../models/mainwindow/current-app.type';

@Directive({
	selector: '[activeTheme]',
})
export class ActiveThemeDirective {
	// https://stackoverflow.com/questions/35168683/hostbinding-with-a-variable-class-in-angular2/35183074#35183074
	@HostBinding('class.collection-theme') get collectionTheme() {
		return this.activeTheme === 'collection';
	}
	@HostBinding('class.achievements-theme') get achievementsTheme() {
		return this.activeTheme === 'achievements';
	}
	@HostBinding('class.decktracker-theme') get decktrackerTheme() {
		return this.activeTheme === 'decktracker';
	}
	@HostBinding('class.general-theme') get generalTheme() {
		return this.activeTheme === 'general';
	}
	@Input() activeTheme: CurrentAppType | 'general';
}
