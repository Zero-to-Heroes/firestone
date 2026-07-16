import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, Renderer2 } from '@angular/core';

// Purely visual effect: all mouse listeners run outside the Angular zone and mutate the style
// directly, so that moving the mouse over a card doesn't trigger any change detection
@Directive({
	standalone: false,
	selector: '[rotateOnMouseOver]',
})
export class RotateOnMouseOverDirective implements AfterViewInit, OnDestroy {
	private imageWidth: number;
	private imageHeight: number;
	private isMouseOver: boolean;

	private removeListeners: (() => void)[] = [];

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly ngZone: NgZone,
	) {}

	ngAfterViewInit() {
		this.setStyles('scale3d(0.8, 0.8, 0.8)');
		this.ngZone.runOutsideAngular(() => {
			this.removeListeners = [
				this.renderer.listen(this.el.nativeElement, 'mouseover', (event: MouseEvent) =>
					this.onMouseOver(event),
				),
				this.renderer.listen(this.el.nativeElement, 'mouseleave', (event: MouseEvent) =>
					this.onMouseLeave(event),
				),
				this.renderer.listen(this.el.nativeElement, 'mousemove', (event: MouseEvent) =>
					this.onMouseMove(event),
				),
			];
		});
	}

	ngOnDestroy() {
		this.removeListeners.forEach((remove) => remove());
		this.removeListeners = [];
	}

	private onMouseOver(event: MouseEvent) {
		this.isMouseOver = true;
		this.imageWidth = this.el.nativeElement.getBoundingClientRect()?.width;
		this.imageHeight = this.el.nativeElement.getBoundingClientRect()?.height;
	}

	private onMouseLeave(event: MouseEvent) {
		this.isMouseOver = false;
		this.setStyles(`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(0.8, 0.8, 0.8)`);
	}

	private onMouseMove(event: MouseEvent) {
		if (!this.isMouseOver) {
			return;
		}

		const xRatio = event.offsetX / this.imageWidth;
		const yRatio = event.offsetY / this.imageHeight;
		const styleAmplifier = 2;
		const yRotation = -Math.min(30, styleAmplifier * (xRatio * 16 - 8));
		const xRotation = Math.min(30, styleAmplifier * (yRatio * 16 - 8));
		this.setStyles(`perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1, 1, 1)`);
	}

	private setStyles(transform: string) {
		const element = this.el.nativeElement;
		this.renderer.setStyle(element, 'transform', transform);
		this.renderer.setStyle(element, 'width', '125%');
		this.renderer.setStyle(element, 'height', '125%');
	}
}
