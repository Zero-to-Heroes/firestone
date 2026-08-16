import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SpotlightMediaLightboxComponent } from './spotlight-media-lightbox.component';

export interface SpotlightMediaLightboxOptions {
	readonly url: string;
	readonly mediaType: 'image' | 'video';
}

@Injectable({ providedIn: 'root' })
export class SpotlightMediaLightboxService implements OnDestroy {
	private overlayRef: OverlayRef | null = null;
	private subscriptions: Subscription[] = [];

	constructor(
		private readonly overlay: Overlay,
		private readonly injector: Injector,
	) {}

	open(options: SpotlightMediaLightboxOptions) {
		if (!options?.url) {
			return;
		}
		this.close();
		this.overlayRef = this.overlay.create({
			hasBackdrop: true,
			backdropClass: 'spotlight-media-lightbox-backdrop',
			disposeOnNavigation: true,
			width: '100%',
			height: '100%',
			positionStrategy: this.overlay.position().global(),
			scrollStrategy: this.overlay.scrollStrategies.block(),
			panelClass: 'spotlight-media-lightbox-pane',
		});
		const portal = new ComponentPortal(SpotlightMediaLightboxComponent, null, this.injector);
		const componentRef = this.overlayRef.attach(portal);
		componentRef.instance.url = options.url;
		componentRef.instance.mediaType = options.mediaType;
		componentRef.changeDetectorRef.detectChanges();

		this.subscriptions.push(componentRef.instance.close.subscribe(() => this.close()));
		this.subscriptions.push(this.overlayRef.backdropClick().subscribe(() => this.close()));
		this.subscriptions.push(
			this.overlayRef.keydownEvents().subscribe((event) => {
				if (event.key === 'Escape') {
					this.close();
				}
			}),
		);
	}

	close() {
		for (const sub of this.subscriptions) {
			sub.unsubscribe();
		}
		this.subscriptions = [];
		if (this.overlayRef) {
			this.overlayRef.dispose();
			this.overlayRef = null;
		}
	}

	ngOnDestroy() {
		this.close();
	}
}
