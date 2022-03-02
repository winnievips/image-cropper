import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FromPluginPage } from './from-plugin.page';

const routes: Routes = [
  {
    path: '',
    component: FromPluginPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FromPluginPageRoutingModule {}
