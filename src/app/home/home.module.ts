import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { ImageCropperModule } from '../component/image-cropper.module';
import 'hammerjs/hammer';
import 'hammerjs';
import { SwiperModule } from 'swiper/angular';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    ImageCropperModule,
    SwiperModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
