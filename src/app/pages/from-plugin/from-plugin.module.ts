import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FromPluginPageRoutingModule } from './from-plugin-routing.module';

import { FromPluginPage } from './from-plugin.page';
import { ImageCropperModule } from 'ngx-image-cropper';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FromPluginPageRoutingModule,
    ImageCropperModule,
    SwiperModule
  ],
  declarations: [FromPluginPage]
})
export class FromPluginPageModule {}
