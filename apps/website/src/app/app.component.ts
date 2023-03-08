import { AfterContentInit, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteBootstrapService } from 'libs/website/core/src/lib/website-bootstrap.service';
import { from, Observable, startWith } from 'rxjs';

@Component({
	selector: 'website-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	initComplete$: Observable<boolean>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly bootstrap: WebsiteBootstrapService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.initComplete$ = from(this.bootstrap.init()).pipe(
			startWith(false),
			this.mapData((initComplete) => initComplete),
		);
	}
}
