import { AfterContentInit, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteBootstrapService } from '@firestone/website/core';
import { Observable, from, startWith } from 'rxjs';

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
		private readonly router: Router,
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
