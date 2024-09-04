import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HighlighterPipe } from './pipes/highlighter.pipe';
import { CdkOverlayContainer } from './services/cdk-overlay-container.service';

const components = [HighlighterPipe];

@NgModule({
	imports: [CommonModule],
	providers: [CdkOverlayContainer],
	declarations: components,
	exports: components,
})
export class SharedFrameworkCommonModule {}
