import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'web-arena',
	templateUrl: './arena.component.html',
	styleUrls: ['./arena.component.scss'],
	imports: [InlineSVGModule],
})
export class ArenaComponent {}
