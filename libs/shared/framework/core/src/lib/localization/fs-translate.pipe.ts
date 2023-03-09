import { ChangeDetectorRef, Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ILocalizationService } from './localization.service';

@Injectable()
@Pipe({
	name: 'fsTranslate',
	pure: false, // required to update the value when the promise is resolved
})
export class FsTranslatePipe extends TranslatePipe implements PipeTransform {
	constructor(_ref: ChangeDetectorRef, i18n: ILocalizationService) {
		const translateService: TranslateService = i18n.getTranslateService();
		super(translateService, _ref);
	}
}
