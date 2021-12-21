import { AfterContentInit, ChangeDetectorRef, Component, ElementRef, Input, Renderer2, ViewRef } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DebugService } from '../../../services/debug.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'opponent-card-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/opponenthand/opponent-card-info.component.scss',
	],
	template: `
		<div class="opponent-card-info scalable" [style.left.vh]="leftVwOffset" [style.top.vh]="topVwOffset">
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
export class OpponentCardInfoComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;
	@Input() displayTurnNumber: boolean;
	// Weuse vh instead of vw here, because the height of the playing area is not affected when
	// you resize the window. The width on the other hand changes, because the border outside of
	// the play area are cropped
	@Input() leftVwOffset: number;
	@Input() topVwOffset: number;
	@Input() set card(value: DeckCard) {
		this._card = value;
	}

	_card: DeckCard;

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly init_DebugService: DebugService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.store
			.listenPrefs$((prefs) => prefs.decktrackerOpponentHandScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				console.debug('updating scale', scale);
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}
}
