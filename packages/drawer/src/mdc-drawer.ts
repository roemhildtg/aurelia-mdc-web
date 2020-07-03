import { MdcComponent } from '@aurelia-mdc-web/base';
import { MDCDismissibleDrawerFoundation, cssClasses, strings, MDCModalDrawerFoundation, util, MDCDrawerAdapter } from '@material/drawer';
import { MDCDrawerFocusTrapFactory } from '@material/drawer/util';
import { SpecificEventListener } from '@material/base';
import { MDCListFoundation } from '@material/list';
import { FocusTrap } from '@material/dom/focus-trap';
import { inject, useView, customElement } from 'aurelia-framework';
import { PLATFORM } from 'aurelia-pal';
import { bindable } from 'aurelia-typed-observable-plugin';

@inject(Element)
@useView(PLATFORM.moduleName('./mdc-drawer.html'))
@customElement(cssClasses.ROOT)
export class MdcDrawer extends MdcComponent<MDCDismissibleDrawerFoundation> {
  @bindable.booleanAttr
  dismissible: boolean;

  @bindable.booleanAttr
  modal: boolean;

  /**
   * @return boolean Proxies to the foundation's `open`/`close` methods.
   * Also returns true if drawer is in the open position.
   */
  get open(): boolean {
    return this.foundation.isOpen();
  }

  /**
   * Toggles the drawer open and closed.
   */
  set open(isOpen: boolean) {
    if (isOpen) {
      this.foundation.open();
    } else {
      this.foundation.close();
    }
  }

  private previousFocus_?: Element | null;
  private scrim_!: HTMLElement | null; // assigned in initialSyncWithDOM()

  private focusTrap_?: FocusTrap; // assigned in initialSyncWithDOM()
  private focusTrapFactory_!: MDCDrawerFocusTrapFactory; // assigned in initialize()

  private handleScrimClick_?: SpecificEventListener<'click'>; // initialized in initialSyncWithDOM()
  private handleKeydown_!: SpecificEventListener<'keydown'>; // initialized in initialSyncWithDOM()
  private handleTransitionEnd_!: SpecificEventListener<'transitionend'>; // initialized in initialSyncWithDOM()

  async initialise() {
    // const listEl =
    //   this.root.querySelector(`.${MDCListFoundation.cssClasses.ROOT}`);
    // if (listEl) {
    //   this.list_ = listFactory(listEl);
    //   this.list_.wrapFocus = true;
    // }
    this.focusTrapFactory_ = el => new FocusTrap(el);
  }

  initialSyncWithDOM() {
    const { MODAL } = cssClasses;
    const { SCRIM_SELECTOR } = strings;

    this.scrim_ = (this.root.parentNode as Element).querySelector<HTMLElement>(SCRIM_SELECTOR);

    if (this.scrim_ && this.root.classList.contains(MODAL)) {
      this.handleScrimClick_ = () => (this.foundation as MDCModalDrawerFoundation).handleScrimClick();
      this.scrim_.addEventListener('click', this.handleScrimClick_);
      this.focusTrap_ = util.createFocusTrapInstance(this.root as HTMLElement, this.focusTrapFactory_);
    }

    this.handleKeydown_ = (evt) => this.foundation.handleKeydown(evt);
    this.handleTransitionEnd_ = (evt) => this.foundation.handleTransitionEnd(evt);

    this.listen('keydown', this.handleKeydown_);
    this.listen('transitionend', this.handleTransitionEnd_);
  }

  destroy() {
    this.unlisten('keydown', this.handleKeydown_);
    this.unlisten('transitionend', this.handleTransitionEnd_);

    // if (this.list_) {
    //   this.list_.destroy();
    // }

    const { MODAL } = cssClasses;
    if (this.scrim_ && this.handleScrimClick_ &&
      this.root.classList.contains(MODAL)) {
      this.scrim_.removeEventListener('click', this.handleScrimClick_);
      // Ensure drawer is closed to hide scrim and release focus
      this.open = false;
    }
  }

  getDefaultFoundation() {
    // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
    // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
    const adapter: MDCDrawerAdapter = {
      addClass: (className) => this.root.classList.add(className),
      removeClass: (className) => this.root.classList.remove(className),
      hasClass: (className) => this.root.classList.contains(className),
      elementHasClass: (element, className) => element.classList.contains(className),
      saveFocus: () => this.previousFocus_ = document.activeElement,
      restoreFocus: () => {
        const previousFocus = this.previousFocus_ as HTMLOrSVGElement | null;
        if (previousFocus && previousFocus.focus &&
          this.root.contains(document.activeElement)) {
          previousFocus.focus();
        }
      },
      focusActiveNavigationItem: () => {
        const activeNavItemEl = this.root.querySelector<HTMLElement>(
          `.${MDCListFoundation.cssClasses.LIST_ITEM_ACTIVATED_CLASS}`);
        if (activeNavItemEl) {
          activeNavItemEl.focus();
        }
      },
      notifyClose: () => this.emit(strings.CLOSE_EVENT, {}, true /* shouldBubble */),
      notifyOpen: () => this.emit(strings.OPEN_EVENT, {}, true /* shouldBubble */),
      trapFocus: () => this.focusTrap_?.trapFocus(),
      releaseFocus: () => this.focusTrap_?.releaseFocus(),
    };

    const { DISMISSIBLE, MODAL } = cssClasses;
    if (this.root.classList.contains(DISMISSIBLE)) {
      return new MDCDismissibleDrawerFoundation(adapter);
    } else if (this.root.classList.contains(MODAL)) {
      return new MDCModalDrawerFoundation(adapter);
    } else {
      throw new Error(`MDCDrawer: Failed to instantiate component. Supported variants are ${DISMISSIBLE} and ${MODAL}.`);
    }
  }

  toggle(){
    this.open = !this.open;
  }
}
