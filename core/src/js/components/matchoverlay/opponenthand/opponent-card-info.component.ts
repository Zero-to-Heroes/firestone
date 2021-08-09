import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'opponent-card-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-info.component.scss',
	],
	template: `
		<div class="opponent-card-info scalable" [style.left.vw]="leftVwOffset" [style.top.vw]="topVwOffset">
			<opponent-card-turn-number *ngIf="displayTurnNumber" [card]="_card"></opponent-card-turn-number>
			<opponent-card-info-id
				*ngIf="displayGuess || displayBuff"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
				[card]="_card"
			></opponent-card-info-id>
		</div>
	`,
})
export class OpponentCardInfoComponent implements AfterViewInit, OnDestroy {
	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;
	@Input() displayTurnNumber: boolean;
	// Weuse vh instead of vw here, because the height of the playing area is not affected when
	// you resize the window. The width on the other hand changes, because the border outside of
	// the play area are cropped
	@Input() leftVwOffset: number;
	@Input() topVwOffset: number;
	_card: DeckCard;

	@Input() set card(value: DeckCard) {
		this._card = value;
	}

	private scale;
	private preferencesSubscription: Subscription;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		await this.handleDisplayPreferences();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.preferencesSubscription?.unsubscribe();
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.scale = preferences.decktrackerOpponentHandScale;
		this.onResized();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private onResized() {
		const newScale = this.scale / 100;
		const element = this.el.nativeElement.querySelector('.scalable');
		this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
