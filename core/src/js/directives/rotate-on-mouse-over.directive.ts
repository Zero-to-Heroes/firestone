import { ChangeDetectorRef, Directive, ElementRef, HostBinding, HostListener, ViewRef } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Directive({
	selector: '[rotateOnMouseOver]',
})
export class RotateOnMouseOverDirective {
	@HostBinding('style.transform') styleTransform: SafeStyle = 'scale3d(1, 1, 1)';

	private imageWidth: number;
	private imageHeight: number;
	private isMouseOver: boolean;

	constructor(
		private readonly el: ElementRef,
		private readonly sanitizer: DomSanitizer,
		private readonly cdr: ChangeDetectorRef,
	) {}

	@HostListener('mouseover', ['$event'])
	onMouseOver(event: MouseEvent) {
		this.isMouseOver = true;
		this.imageWidth = this.el.nativeElement.getBoundingClientRect()?.width;
		this.imageHeight = this.el.nativeElement.getBoundingClientRect()?.height;
	}

	@HostListener('mouseleave', ['$event'])
	onMouseLeave(event: MouseEvent) {
		this.isMouseOver = false;
		this.styleTransform = this.sanitizer.bypassSecurityTrustStyle(
			`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mousemove', ['$event'])
	onMouseMove(event: MouseEvent) {
		if (!this.isMouseOver) {
			return;
		}

		const xRatio = event.offsetX / this.imageWidth;
		const yRatio = event.offsetY / this.imageHeight;
		const styleAmplifier = 1;
		const yRotation = -Math.min(30, styleAmplifier * (xRatio * 16 - 8));
		const xRotation = Math.min(30, styleAmplifier * (yRatio * 16 - 8));
		this.styleTransform = this.sanitizer.bypassSecurityTrustStyle(
			`perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.035, 1.035, 1.035)`,
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
