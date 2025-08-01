import { Component } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'web-constructed',
	templateUrl: './constructed.component.html',
	styleUrls: ['./constructed.component.scss'],
	imports: [InlineSVGModule, SharedFrameworkCoreModule],
})
export class ConstructedComponent {}
