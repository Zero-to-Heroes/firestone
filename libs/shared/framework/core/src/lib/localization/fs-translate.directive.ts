import { ChangeDetectorRef, Directive, ElementRef, Input } from '@angular/core';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ILocalizationService } from './localization.service';

@Directive({
	selector: '[fsTranslate]',
})
export class FsTranslateDirective extends TranslateDirective {
	@Input() set fsTranslate(key: string) {
		super.translate = key;
	}

	constructor(element: ElementRef, _ref: ChangeDetectorRef, i18n: ILocalizationService) {
		const translateService: TranslateService = i18n.getTranslateService();
		super(translateService, element, _ref);
	}
}
