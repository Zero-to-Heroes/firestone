import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'web-constructed',
	templateUrl: './constructed.component.html',
	styleUrls: ['./constructed.component.scss'],
	imports: [InlineSVGModule],
})
export class ConstructedComponent {}
