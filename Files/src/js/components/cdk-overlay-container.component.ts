import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CdkOverlayContainer extends OverlayContainer implements OnDestroy {
	constructor(@Inject(DOCUMENT) _document: any) {
		super(_document);
	}

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
		parent.appendChild(this._containerElement);
	}
}
