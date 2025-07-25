/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { Game } from '@firestone-hs/replay-parser';

@Component({
	standalone: false,
	selector: 'sidebar',
	styleUrls: ['../../global.scss', './sidebar.component.scss'],
	template: `
		<div class="menu" *ngIf="!!decklist?.length || !!opponentDecklist?.length">
			<div class="menu-item" (click)="selectMenu('decks')" [ngClass]="{ selected: selectedMenu === 'decks' }">
				Decks
			</div>
			<div class="menu-item" (click)="selectMenu('events')" [ngClass]="{ selected: selectedMenu === 'events' }">
				Events
			</div>
		</div>
		<player-decks
			class="decks"
			*ngIf="selectedMenu === 'decks'"
			[decklist]="decklist"
			[opponentDecklist]="opponentDecklist"
		></player-decks>
		<events-log
			class="events"
			*ngIf="selectedMenu === 'events'"
			[game]="game"
			[currentTurn]="currentTurn"
			[currentActionInTurn]="currentActionInTurn"
			(updateCurrentAction)="updateCurrentAction.emit($event)"
		>
		</events-log>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
	@Output() updateCurrentAction = new EventEmitter<{ turn: number; action: number } | null>();

	@Input() decklist: string | null;
	@Input() opponentDecklist: string | null;
	@Input() game: Game;
	@Input() currentTurn: number;
	@Input() currentActionInTurn: number;

	selectedMenu: 'decks' | 'events' = 'events';

	constructor(private readonly cdr: ChangeDetectorRef) {}

	selectMenu(menu: 'decks' | 'events') {
		this.selectedMenu = menu;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
