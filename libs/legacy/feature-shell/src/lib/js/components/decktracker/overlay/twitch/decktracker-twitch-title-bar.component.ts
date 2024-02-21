import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DeckState } from '@firestone/game-state';
import { TwitchPreferences } from './twitch-preferences';
import { TwitchPreferencesService } from './twitch-preferences.service';

@Component({
	selector: 'decktracker-twitch-title-bar',
	styleUrls: [
		'../../../../../css/component/decktracker/overlay/decktracker-control-bar.component.scss',
		'./decktracker-twitch-title-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<div class="logo" inlineSVG="assets/svg/decktracker_logo.svg"></div>
			<div
				*ngIf="deckstring"
				class="copy-deckstring"
				(mousedown)="copyDeckstring()"
				(mouseenter)="onMouseEnter()"
				(mouseleave)="onMouseLeave()"
				helpTooltip="Copy the current deck code to the clipboard"
				inlineSVG="assets/svg/copy.svg"
			></div>
			<div class="copy-text" [ngClass]="{ copied: copied }">{{ copyText }}</div>
			<button
				class="i-30 close-button"
				(mousedown)="closeWindow()"
				helpTooltip="Minimize the tracker. You can reactivate it from the settings panel at the left of the stream"
				inlineSVG="assets/svg/control_minimize.svg"
			></button>
		</div>
		<textarea readonly class="deckstring-code" *ngIf="shouldShowDeckstring" (mousedown)="stopBubbling($event)"
			>{{ deckstring }} 
			Copy is temporarily down please copy the code manually.
			(click on the Copy button to close)			
		</textarea
		>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTwitchTitleBarComponent {
	@Input() set deckState(value: DeckState) {
		this.deckstring = value?.duelsStartingDeckstring ?? value?.deckstring;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	deckstring: string;
	copyText: string;
	shouldShowDeckstring = false;
	copied = false;

	constructor(private readonly cdr: ChangeDetectorRef, protected readonly prefs: TwitchPreferencesService) {}

	async copyDeckstring() {
		if (this.shouldShowDeckstring) {
			this.shouldShowDeckstring = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		console.log('navigator.userAgent', navigator.userAgent);
		const copyPermission = await (navigator as any).permissions
			.query({
				// Firefox supports "clipboard", while chrome is "clipboard-write"
				name: 'clipboard-write',
			})
			.catch((err) => {
				console.warn('could not receive permission', err);
			});
		console.log('copyPermission', copyPermission);
		if (copyPermission?.state === 'denied') {
			let worked = false;
			// Twitch on Chrome doesn't implement the clipboard-write permission, so fallbacking to something else
			const listener = (e: ClipboardEvent) => {
				const clipboardData = e.clipboardData;
				if (clipboardData) {
					clipboardData.setData('text/plain', this.deckstring);
					worked = true;
					e.preventDefault();
				}
			};

			document.addEventListener('copy', listener);
			try {
				document.execCommand('copy');
			} finally {
				document.removeEventListener('copy', listener);
			}

			if (worked) {
				this.copyDone();
			} else {
				// See https://github.com/HearthSim/twitch-hdt-frontend/issues/50
				this.copyText = 'Manual copy';
				this.shouldShowDeckstring = true;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		} else {
			(navigator as any).clipboard.writeText(this.deckstring);
			this.copyDone();
		}
		setTimeout(() => {
			this.copied = false;
			this.copyText = null;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 3000);
	}

	stopBubbling(event: MouseEvent) {
		event.stopPropagation();
	}

	onMouseEnter() {
		if (this.copied) {
			return;
		}
		this.copyText = 'Copy';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseLeave() {
		if (this.copied) {
			return;
		}
		this.copyText = null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async closeWindow() {
		const prefs = this.prefs.preferences$$.getValue();
		const newPrefs: TwitchPreferences = { ...prefs, decktrackerOpen: false };
		console.log('changing decktrackerOpen pref', newPrefs);
		this.prefs.savePrefs(newPrefs);
	}

	private copyDone() {
		this.copyText = 'Copied';
		this.copied = true;
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
