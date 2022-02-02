import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TwitchPreferences } from '@components/decktracker/overlay/twitch/twitch-preferences';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { from, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

@Component({
	selector: 'twitch-config-widget',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../../css/component/decktracker/overlay/twitch/twitch-config-widget.component.scss',
	],
	template: `
		<div class="twitch-config-widget">
			<div class="settings" *ngIf="prefs$ | async as prefs">
				<checkbox
					[label]="'twitch.show-hero-cards-help' | owTranslate"
					[labelTooltip]="'twitch.show-hero-cards-help-tooltip' | owTranslate"
					[value]="prefs.showHeroCards"
					(valueChanged)="onShowHeroCardsChanged(prefs, $event)"
				></checkbox>
			</div>
			<div class="side-text">
				<div class="text" [owTranslate]="'twitch.settings-side-text'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchConfigWidgetComponent implements AfterContentInit {
	prefs$: Observable<TwitchPreferences>;

	constructor(private readonly prefs: TwitchPreferencesService, private readonly cdr: ChangeDetectorRef) {}

	async ngAfterContentInit() {
		this.prefs$ = from(this.prefs.prefs.asObservable()).pipe(
			debounceTime(200),
			tap((info) => console.debug('updated info', info)),
			distinctUntilChanged(),
		);
	}

	onShowHeroCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs = { ...prefs, showHeroCards: value };
		console.log('changing hero cards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}
}
