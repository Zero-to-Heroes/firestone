import { OverlayContainer } from '@angular/cdk/overlay';
import { HostListener, Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CdkOverlayContainer extends OverlayContainer implements OnDestroy {
	// constructor(@Inject(DOCUMENT) _document: any) {
	// 	super(_document, Platform.);
	// }

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
	}

	getRootElement(): Element {
		return this._document.querySelector('.overlay-container-parent');
	}

	protected _createContainer(): void {
		super._createContainer();
		this._appendToRootComponent();
	}

	private _appendToRootComponent(): void {
		if (!this._containerElement) {
			return;
		}

		const rootElement = this.getRootElement();
		const parent = rootElement || this._document.body;
		// with decktracker, the overlay start a lot more "left" than the window.
		// in fact, it looks like we need the overlay to have the same size as the
		// window for it to work
		parent.appendChild(this._containerElement);
	}
}
