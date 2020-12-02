// From http://avenshteinohad.blogspot.com/2018/06/custom-ngif-directive.html
import { NgIf } from '@angular/common';
import {
	ChangeDetectorRef,
	Directive,
	ElementRef,
	Input,
	Renderer2,
	RendererStyleFlags2,
	TemplateRef,
	ViewContainerRef,
	ViewRef,
} from '@angular/core';

@Directive({
	selector: '[ngxCacheIf]',
})
export class NgxCacheIfDirective {
	@Input() set ngxCacheIf(value: boolean) {
		this.rendered = this.rendered || value;
		this.ngIfDirective.ngIf = this.rendered;
		setTimeout(() => {
			if (this.rendered) {
				// The current element is the comment about ngIf, so we need to get the next one
				if (!value) {
					this.renderer.setStyle(
						this.el.nativeElement.nextSibling,
						'display',
						'none',
						RendererStyleFlags2.DashCase | RendererStyleFlags2.Important,
					);
				} else {
					this.renderer.removeStyle(this.el.nativeElement.nextSibling, 'display');
				}
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
	}

	private rendered: boolean;
	private ngIfDirective: NgIf;

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly templateRef: TemplateRef<any>,
		private readonly viewContainer: ViewContainerRef,
		private readonly cdr: ChangeDetectorRef,
	) {
		if (!this.ngIfDirective) {
			this.ngIfDirective = new NgIf(this.viewContainer, this.templateRef);
		}
	}
}
