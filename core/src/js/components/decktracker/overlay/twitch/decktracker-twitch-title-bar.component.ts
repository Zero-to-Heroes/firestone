import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DeckState } from '../../../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-twitch-title-bar',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/decktracker-control-bar.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-twitch-title-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#decktracker_logo" />
				</svg>
			</i>
			<i
				*ngIf="deckState?.deckstring"
				class="copy-deckstring"
				(mousedown)="copyDeckstring()"
				(mouseenter)="onMouseEnter()"
				(mouseleave)="onMouseLeave()"
				helpTooltip="Copy the current deck code to the clipboard"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#copy_deckstring" />
				</svg>
			</i>
			<div class="copy-text" [ngClass]="{ 'copied': copied }">{{ copyText }}</div>
			<button
				class="i-30 close-button"
				(mousedown)="closeWindow()"
				helpTooltip="Minimize the tracker. You can reactivate it with the Extension Settings button at the bottom"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#window-control_minimize"></use>
				</svg>
			</button>
		</div>
		<textarea readonly class="deckstring-code" *ngIf="shouldShowDeckstring" (mousedown)="stopBubbling($event)"
			>{{ this.deckState.deckstring }} 
			Copy is temporarily down please copy the code manually.
			(click on the Copy button to close)			
		</textarea
		>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTwitchTitleBarComponent {
	@Input() deckState: DeckState;
	copyText: string;
	shouldShowDeckstring = false;
	copied = false;

	constructor(private cdr: ChangeDetectorRef) {}

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
					clipboardData.setData('text/plain', this.deckState.deckstring);
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
			(navigator as any).clipboard.writeText(this.deckState.deckstring);
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

	closeWindow() {
		(window as any).Twitch.ext.actions.minimize();
	}

	private copyDone() {
		this.copyText = 'Copied';
		this.copied = true;
		console.log('copied deckstring to clipboard', this.deckState.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
