import { ChangeDetectorRef, Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OverwolfService } from '../services/overwolf.service';

@Injectable()
@Pipe({
	name: 'owTranslate',
	pure: false, // required to update the value when the promise is resolved
})
export class OwTranslatePipe extends TranslatePipe implements PipeTransform {
	constructor(ow: OverwolfService, _ref: ChangeDetectorRef) {
		super(ow.getMainWindow().translateService, _ref);
	}
}
