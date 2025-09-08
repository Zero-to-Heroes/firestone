import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
	selector: 'electron-decktracker-widget',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="electron-decktracker-widget" [class.visible]="isVisible">
			<div class="widget-container">
				<div class="title-bar">
					<span class="title">Deck Tracker</span>
					<button class="close-btn" (click)="toggleVisibility()" aria-label="Toggle visibility">
						{{ isVisible ? '−' : '+' }}
					</button>
				</div>

				<div class="content" *ngIf="isVisible">
					<div class="deck-info" *ngIf="currentDeck">
						<h3>{{ currentDeck.name || 'Current Deck' }}</h3>
						<div class="deck-stats" *ngIf="showStats">
							<span class="wins">{{ currentDeck.wins || 0 }}W</span>
							<span class="losses">{{ currentDeck.losses || 0 }}L</span>
							<span class="winrate">{{ getWinrate() }}%</span>
						</div>
					</div>

					<div class="card-list" *ngIf="currentDeck && currentDeck.cards">
						<div
							class="card-item"
							*ngFor="let card of currentDeck.cards"
							[class.remaining]="card.remaining > 0"
							[class.used]="card.remaining === 0"
						>
							<span class="card-name">{{ card.name }}</span>
							<span class="card-count">{{ card.remaining }}/{{ card.total }}</span>
						</div>
					</div>

					<div class="no-deck" *ngIf="!currentDeck">
						<p>No deck detected</p>
						<p class="status">{{ status }}</p>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			.electron-decktracker-widget {
				position: fixed;
				top: 10px;
				right: 10px;
				width: 250px;
				background: rgba(0, 0, 0, 0.85);
				border: 1px solid #444;
				border-radius: 6px;
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
				font-size: 12px;
				color: #fff;
				z-index: 1000;
				backdrop-filter: blur(5px);
				transition: opacity 0.3s ease;
			}

			.electron-decktracker-widget:not(.visible) {
				opacity: 0.7;
			}

			.widget-container {
				padding: 0;
			}

			.title-bar {
				background: rgba(255, 255, 255, 0.1);
				padding: 8px 12px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				border-bottom: 1px solid #444;
				cursor: move;
			}

			.title {
				font-weight: bold;
				font-size: 13px;
			}

			.close-btn {
				background: none;
				border: none;
				color: #fff;
				cursor: pointer;
				font-size: 16px;
				padding: 0;
				width: 20px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.close-btn:hover {
				background: rgba(255, 255, 255, 0.1);
				border-radius: 3px;
			}

			.content {
				padding: 12px;
				max-height: 400px;
				overflow-y: auto;
			}

			.deck-info {
				margin-bottom: 12px;
			}

			.deck-info h3 {
				margin: 0 0 6px 0;
				font-size: 14px;
				color: #ffd700;
			}

			.deck-stats {
				display: flex;
				gap: 8px;
				font-size: 11px;
			}

			.wins {
				color: #4caf50;
			}
			.losses {
				color: #f44336;
			}
			.winrate {
				color: #2196f3;
			}

			.card-list {
				display: flex;
				flex-direction: column;
				gap: 2px;
			}

			.card-item {
				display: flex;
				justify-content: space-between;
				padding: 3px 6px;
				border-radius: 3px;
				transition: background-color 0.2s ease;
			}

			.card-item.remaining {
				background: rgba(76, 175, 80, 0.1);
			}

			.card-item.used {
				background: rgba(255, 255, 255, 0.05);
				opacity: 0.6;
			}

			.card-name {
				flex: 1;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.card-count {
				font-weight: bold;
				min-width: 30px;
				text-align: right;
			}

			.card-item.remaining .card-count {
				color: #4caf50;
			}

			.card-item.used .card-count {
				color: #f44336;
			}

			.no-deck {
				text-align: center;
				padding: 20px;
				color: #999;
			}

			.status {
				font-size: 10px;
				margin-top: 8px;
				font-style: italic;
			}

			/* Scrollbar styling */
			.content::-webkit-scrollbar {
				width: 6px;
			}

			.content::-webkit-scrollbar-track {
				background: rgba(255, 255, 255, 0.1);
				border-radius: 3px;
			}

			.content::-webkit-scrollbar-thumb {
				background: rgba(255, 255, 255, 0.3);
				border-radius: 3px;
			}

			.content::-webkit-scrollbar-thumb:hover {
				background: rgba(255, 255, 255, 0.5);
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronDecktrackerWidgetComponent implements OnInit, OnDestroy {
	isVisible = true;
	showStats = true;
	status = 'Connecting to game...';

	currentDeck: DeckData | null = null;

	constructor(private cdr: ChangeDetectorRef) {}

	ngOnInit() {
		// TODO: Connect to game state service
		this.initializeMockData();
	}

	ngOnDestroy() {
		// TODO: Clean up subscriptions
	}

	toggleVisibility() {
		this.isVisible = !this.isVisible;
		this.cdr.detectChanges();
	}

	getWinrate(): number {
		if (!this.currentDeck || (!this.currentDeck.wins && !this.currentDeck.losses)) {
			return 0;
		}
		const total = this.currentDeck.wins + this.currentDeck.losses;
		return Math.round((this.currentDeck.wins / total) * 100);
	}

	private initializeMockData() {
		// Mock data for testing - will be replaced with real game state integration
		setTimeout(() => {
			this.currentDeck = {
				name: 'Sample Deck',
				wins: 7,
				losses: 3,
				cards: [
					{ name: 'Fireball', total: 2, remaining: 1 },
					{ name: 'Frostbolt', total: 2, remaining: 2 },
					{ name: 'Arcane Intellect', total: 2, remaining: 0 },
					{ name: 'Polymorph', total: 1, remaining: 1 },
					{ name: 'Flamestrike', total: 1, remaining: 1 },
					{ name: 'Water Elemental', total: 2, remaining: 1 },
					{ name: 'Mana Wyrm', total: 2, remaining: 0 },
					{ name: "Sorcerer's Apprentice", total: 2, remaining: 2 },
				],
			};
			this.status = 'Connected to game';
			this.cdr.detectChanges();
		}, 2000);
	}
}

interface DeckData {
	name: string;
	wins: number;
	losses: number;
	cards: CardData[];
}

interface CardData {
	name: string;
	total: number;
	remaining: number;
}
