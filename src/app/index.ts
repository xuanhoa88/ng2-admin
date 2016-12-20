// import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { HomeModule } from '../home';
import { ProjectsModule } from '../projects';
import { AppComponent } from './components/app';
declare var bowser: any;
console.log(bowser);
@NgModule({
  bootstrap: [
    AppComponent
  ],
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], {useHash: true}),
    HomeModule,
    ProjectsModule
  ],
  providers: [
    // {provide: APP_BASE_HREF, useValue: '/'}
  ]
})
export class AppModule {}
