import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'web-battlegrounds',
	templateUrl: './battlegrounds.component.html',
	styleUrls: ['./battlegrounds.component.scss'],
	imports: [InlineSVGModule],
})
export class BattlegroundsComponent {}
