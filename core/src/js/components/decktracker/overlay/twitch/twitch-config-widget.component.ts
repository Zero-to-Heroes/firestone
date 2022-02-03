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
				<checkbox
					[label]="'twitch.show-minions-list' | owTranslate"
					[labelTooltip]="'twitch.show-minions-list-tooltip' | owTranslate"
					[value]="prefs.showMinionsList"
					(valueChanged)="onShowMinionsListChanged(prefs, $event)"
				></checkbox>
				<checkbox
					[label]="'twitch.show-minions-list-golden-cards' | owTranslate"
					[labelTooltip]="'twitch.show-minions-list-golden-cards-tooltip' | owTranslate"
					[value]="prefs.showMinionsListGoldenCards"
					(valueChanged)="onShowMinionsListGoldenCardsChanged(prefs, $event)"
				></checkbox>
				<checkbox
					[label]="'twitch.show-battle-simulator' | owTranslate"
					[value]="prefs.showBattleSimulator"
					(valueChanged)="onShowBattleSimulatorChanged(prefs, $event)"
				></checkbox>
				<numeric-input
					class="input sim-size indented"
					[label]="'twitch.battle-simulator-size' | owTranslate"
					[value]="prefs.battleSimScale"
					[disabled]="!prefs.showBattleSimulator"
					[minValue]="10"
					[incrementStep]="5"
					(valueChange)="onBattleSimScaleChanged(prefs, $event)"
				></numeric-input>

				<!-- <div class="input sim-size indented" [ngClass]="{ 'disabled': !prefs.showBattleSimulator }">
					<div class="label" [owTranslate]="'twitch.battle-simulator-size'"></div>
					<input
						type="number"
						[ngModel]="prefs.battleSimScale"
						(ngModelChange)="onBattleSimScaleChanged(prefs, $event)"
						(mousedown)="preventDrag($event)"
						(dblclick)="$event.target.select()"
					/>
					<div class="buttons">
						<button
							class="arrow up"
							inlineSVG="assets/svg/arrow.svg"
							(click)="incrementBattleSimScale(prefs)"
						></button>
						<button
							class="arrow down"
							inlineSVG="assets/svg/arrow.svg"
							(click)="decrementBattleSimScale(prefs)"
						></button>
					</div>
				</div> -->
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
	battleSimScale: number;

	constructor(private readonly prefs: TwitchPreferencesService, private readonly cdr: ChangeDetectorRef) {}

	async ngAfterContentInit() {
		this.prefs$ = from(this.prefs.prefs.asObservable()).pipe(
			debounceTime(200),
			tap((info) => console.debug('updated info', info)),
			distinctUntilChanged(),
		);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	onShowHeroCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showHeroCards: value };
		console.log('changing showHeroCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowMinionsListChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showMinionsList: value };
		console.log('changing showMinionsList pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowMinionsListGoldenCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showMinionsListGoldenCards: value };
		console.log('changing showMinionsListGoldenCards pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onShowBattleSimulatorChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showBattleSimulator: value };
		console.log('changing showBattleSimulator pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onBattleSimScaleChanged(prefs: TwitchPreferences, value: number) {
		const newPrefs: TwitchPreferences = { ...prefs, battleSimScale: value };
		console.log('changing battleSimScale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	incrementBattleSimScale(prefs: TwitchPreferences) {
		const newPrefs: TwitchPreferences = { ...prefs, battleSimScale: prefs.battleSimScale + 5 };
		console.log('incrementing battleSimScale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	decrementBattleSimScale(prefs: TwitchPreferences) {
		const newPrefs: TwitchPreferences = { ...prefs, battleSimScale: prefs.battleSimScale - 5 };
		console.log('incrementing battleSimScale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}
}
