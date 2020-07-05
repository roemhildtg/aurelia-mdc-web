import { PLATFORM, FrameworkConfiguration } from 'aurelia-framework';

export { MdcRipple } from './mdc-ripple';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    PLATFORM.moduleName('./mdc-ripple')
  ]);
}
