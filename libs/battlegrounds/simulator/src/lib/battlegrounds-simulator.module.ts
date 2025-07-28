import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BgsHeroPortraitSimulatorComponent } from './components/bgs-hero-portrait-simulator.component';
import { BgsMinusButtonComponent } from './components/bgs-minus-button.component';
import { BgsPlusButtonComponent } from './components/bgs-plus-button.component';
import { BgsSimulatorGlobalInfoSelectionComponent } from './components/bgs-simulator-global-info-selection.component';
import { BgsSimulatorHeroPowerSelectionComponent } from './components/bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './components/bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from './components/bgs-simulator-minion-selection.component';
import { BattlegroundsSimulatorMinionTierFilterDropdownComponent } from './components/bgs-simulator-minion-tier-filter-dropdown.component';
import { BattlegroundsSimulatorMinionTribeFilterDropdownComponent } from './components/bgs-simulator-minion-tribe-filter-dropdown.component';
import { BgsSimulatorPlayerOverviewComponent } from './components/bgs-simulator-player-overview.component';
import { BgsSimulatorQuestRewardSelectionComponent } from './components/bgs-simulator-quest-reward-selection.component';
import { BgsSimulatorSideComponent } from './components/bgs-simulator-side.component';
import { BgsSimulatorTrinketSelectionComponent } from './components/bgs-simulator-trinket-selection.component';
import { BgsSimulatorComponent } from './components/bgs-simulator.component';
import { BgsBattlePositioningMockExecutorService } from './services/bgs-battle-positioning-mock-executor.service';
import { BgsBattlePositioningService } from './services/bgs-battle-positioning.service';
import { BgsSimulatorControllerService } from './services/sim-ui-controller/bgs-simulator-controller.service';
import { StateManagerService } from './services/sim-ui-controller/state-manager.service';
import { BgsSimulatorKeyboardControls } from './services/simulator-keyboard-controls.service';

const components = [
	BgsSimulatorComponent,
	BgsSimulatorSideComponent,
	BgsSimulatorPlayerOverviewComponent,
	BgsPlusButtonComponent,
	BgsMinusButtonComponent,
	BgsHeroPortraitSimulatorComponent,
	BgsSimulatorHeroPowerSelectionComponent,
	BgsSimulatorTrinketSelectionComponent,
	BgsSimulatorGlobalInfoSelectionComponent,
	BgsSimulatorHeroSelectionComponent,
	BgsSimulatorQuestRewardSelectionComponent,
	BgsSimulatorMinionSelectionComponent,
	BattlegroundsSimulatorMinionTierFilterDropdownComponent,
	BattlegroundsSimulatorMinionTribeFilterDropdownComponent,
];

@NgModule({
	imports: [
		CommonModule,
		BrowserModule,
		BrowserAnimationsModule,
		DragDropModule,
		ReactiveFormsModule,
		FormsModule,

		InlineSVGModule.forRoot(),

		ReplayColiseumModule,
		// ColiseumComponentsModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		BattlegroundsCoreModule,
		BattlegroundsViewModule,
		BattlegroundsCommonModule,
	],
	providers: [
		BgsBattlePositioningMockExecutorService,
		BgsSimulatorControllerService,
		BgsBattlePositioningService,
		BgsSimulatorKeyboardControls,
		StateManagerService,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsSimulatorModule {}
