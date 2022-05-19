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
				<section class="constructed">
					<div class="section-title" [owTranslate]="'twitch.constructed-section-title'"></div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-related-cards-help' | owTranslate"
							[labelTooltip]="'twitch.show-related-cards-help-tooltip' | owTranslate"
							[value]="prefs.showRelatedCards"
							(valueChanged)="onShowRelatedCardsChanged(prefs, $event)"
						></checkbox>
					</div>
				</section>
				<section class="battlegrounds">
					<div class="section-title" [owTranslate]="'twitch.battlegrounds-section-title'"></div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-hero-cards-help' | owTranslate"
							[labelTooltip]="'twitch.show-hero-cards-help-tooltip' | owTranslate"
							[value]="prefs.showHeroCards"
							(valueChanged)="onShowHeroCardsChanged(prefs, $event)"
						></checkbox>
						<numeric-input
							class="item input board-size"
							[label]="'twitch.last-board-size' | owTranslate"
							[labelTooltip]="'twitch.last-board-size-tooltip' | owTranslate"
							[value]="prefs.heroBoardScale"
							[minValue]="10"
							[incrementStep]="5"
							(valueChange)="onHeroBoardScaleChanged(prefs, $event)"
						></numeric-input>
					</div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-minions-list' | owTranslate"
							[labelTooltip]="'twitch.show-minions-list-tooltip' | owTranslate"
							[value]="prefs.showMinionsList"
							(valueChanged)="onShowMinionsListChanged(prefs, $event)"
						></checkbox>
						<checkbox
							class="item indented"
							[label]="'twitch.show-minions-list-golden-cards' | owTranslate"
							[labelTooltip]="'twitch.show-minions-list-golden-cards-tooltip' | owTranslate"
							[disabled]="!prefs.showMinionsList"
							[value]="prefs.showMinionsListGoldenCards"
							(valueChanged)="onShowMinionsListGoldenCardsChanged(prefs, $event)"
						></checkbox>
						<numeric-input
							class="item input minions-list-size indented"
							[label]="'twitch.minions-list-size' | owTranslate"
							[value]="prefs.minionsListScale"
							[disabled]="!prefs.showMinionsList"
							[minValue]="10"
							[incrementStep]="5"
							(valueChange)="onMinionsListScaleChanged(prefs, $event)"
						></numeric-input>
					</div>
					<div class="group">
						<checkbox
							class="item"
							[label]="'twitch.show-battle-simulator' | owTranslate"
							[value]="prefs.showBattleSimulator"
							(valueChanged)="onShowBattleSimulatorChanged(prefs, $event)"
						></checkbox>
						<numeric-input
							class="item input sim-size indented"
							[label]="'twitch.battle-simulator-size' | owTranslate"
							[value]="prefs.battleSimScale"
							[disabled]="!prefs.showBattleSimulator"
							[minValue]="10"
							[incrementStep]="5"
							(valueChange)="onBattleSimScaleChanged(prefs, $event)"
						></numeric-input>
					</div>
				</section>
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

	onShowRelatedCardsChanged(prefs: TwitchPreferences, value: boolean) {
		const newPrefs: TwitchPreferences = { ...prefs, showRelatedCards: value };
		console.log('changing showRelatedCards pref', newPrefs);
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

	onMinionsListScaleChanged(prefs: TwitchPreferences, value: number) {
		const newPrefs: TwitchPreferences = { ...prefs, minionsListScale: value };
		console.log('changing minionsListScale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	onHeroBoardScaleChanged(prefs: TwitchPreferences, value: number) {
		const newPrefs: TwitchPreferences = { ...prefs, heroBoardScale: value };
		console.log('changing heroBoardScale pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}
}
