import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Root module
import { decorateModuleRef } from './environment';
import { AppModule } from './app';

// shared styles
import './shared/styles/app.scss';

if (process.env.NODE_ENV === 'production') {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(decorateModuleRef)
  .catch(err => console.error(err));
});
