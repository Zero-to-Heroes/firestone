import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CdkOverlayContainer } from './services/cdk-overlay-container.service';

@NgModule({
	imports: [CommonModule],
	providers: [CdkOverlayContainer],
})
export class SharedFrameworkCommonModule {}
