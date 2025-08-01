import { Component } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'battlegrounds-compositions',
	templateUrl: './battlegrounds-compositions.component.html',
	styleUrls: ['./battlegrounds-compositions.component.scss'],
	imports: [InlineSVGModule, SharedFrameworkCoreModule],
})
export class BattlegroundsCompositionsComponent {}
