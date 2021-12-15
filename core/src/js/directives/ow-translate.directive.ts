import { ChangeDetectorRef, Directive, ElementRef, Input } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';
import { OverwolfService } from '../services/overwolf.service';

@Directive({
	selector: '[owTranslate]',
})
export class OwTranslateDirective extends TranslateDirective {
	@Input() set owTranslate(key: string) {
		super.translate = key;
	}

	constructor(ow: OverwolfService, element: ElementRef, _ref: ChangeDetectorRef) {
		super(ow.getMainWindow().translateService, element, _ref);
	}
}
