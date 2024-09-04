import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { MarkdownModule } from 'ngx-markdown';
import { NewVersionNotificationComponent } from './components/new-version-notification.component';

const components = [NewVersionNotificationComponent];
@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,

		InlineSVGModule.forRoot(),
		MarkdownModule.forRoot({ loader: HttpClient }),

		SharedFrameworkCoreModule,
		SharedCommonViewModule,
	],
	declarations: components,
	exports: components,
	providers: [],
})
export class AppCommonModule {}
