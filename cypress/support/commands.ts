/// <reference types="cypress" />

// ---------- Utils: flags para evitar que salga el modal ----------
const setNoModalFlags = (win: Cypress.AUTWindow) => {
  try {
    // Sustituye por las claves reales si las conoces
    win.localStorage.setItem('hidePromoModal', 'true');
    win.localStorage.setItem('modalDismissed', 'true');
    win.document.cookie = 'hidePromoModal=true; path=/';
  } catch {
    // no-op
    return;
  }
};

// ---------- Comando: cerrar/ocultar modal si aparece (modo agresivo) ----------
Cypress.Commands.add('dismissLandingModal', () => {
  // 1) Intento elegante: botón de cerrar o ESC
  cy.get('body', { log: false }).then(($body) => {
    const closeSelectors = [
      'button[aria-label="Close"]',
      '[data-testid="close-modal"]',
      '[data-test="close-modal"]',
      '.modal .close',
      '.ReactModal__Close',
      '.swal2-close',
      '.newsletter-modal .close',
      '.ant-modal-close',
    ].join(',');

    const hasClose = $body.find(closeSelectors).length > 0;
    const hasOverlay =
      $body.find('.modal, .ReactModal__Overlay, .swal2-container, .ant-modal-root').length > 0;

    if (hasClose) {
      cy.wrap($body).find(closeSelectors).first().click({ force: true });
    } else if (hasOverlay) {
      cy.wrap($body).type('{esc}', { force: true });
    }
  });

  // 2) Plan C: si sigue el overlay, lo quitamos/ocultamos del DOM
  cy.window({ log: false }).then((win) => {
    const aggressiveSelectors = [
      '[role="dialog"]',
      '.modal',
      '.ReactModal__Overlay',
      '.swal2-container',
      '.ant-modal-root',
      // overlays tipo Tailwind (fixed + inset-0 + bg-opacity)
      'div[class*="fixed"][class*="inset-0"][class*="bg-opacity"]',
      // backdrops comunes
      '.modal-backdrop, .MuiBackdrop-root, .ant-drawer-mask',
    ].join(',');

    const nodes = win.document.querySelectorAll<HTMLElement>(aggressiveSelectors);
    nodes.forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      try {
        el.parentElement?.removeChild(el);
      } catch {
        // no-op
        return;
      }
    });

    try {
      win.document.body.classList.remove('overflow-hidden', 'modal-open');
      win.document.body.style.removeProperty('overflow');
    } catch {
      // no-op
      return;
    }
  });
});

// ---------- Overwrite de cy.visit: SOLO inyecta flags antes de cargar ----------
Cypress.Commands.overwrite(
  'visit',
  (
    orig,
    urlOrOptions: string | Partial<Cypress.VisitOptions>,
    options?: Partial<Cypress.VisitOptions>
  ) => {
    let finalUrl: string;
    let finalOptions: Partial<Cypress.VisitOptions> = {};

    if (typeof urlOrOptions === 'string') {
      finalUrl = urlOrOptions;
      finalOptions = options || {};
    } else {
      finalUrl = urlOrOptions.url || '/';
      finalOptions = urlOrOptions;
    }

    const merged: Partial<Cypress.VisitOptions> = {
      ...finalOptions,
      onBeforeLoad: (win: Cypress.AUTWindow) => {
        setNoModalFlags(win);
        if (finalOptions.onBeforeLoad) {
          (finalOptions.onBeforeLoad as (w: Cypress.AUTWindow) => void)(win);
        }
      },
    };

    // Forzamos la firma de un solo argumento: visit({ url, ... })
    const mergedOptions: Partial<Cypress.VisitOptions> & { url: string } = {
      ...merged,
      url: finalUrl,
    };

    return (
      orig as (opts: Partial<Cypress.VisitOptions> & { url: string }) => Cypress.Chainable<Cypress.AUTWindow>
    )(mergedOptions);
  }
);

// ---------- Quita overlay y lo "mata" para el resto de la página ----------
Cypress.Commands.add('ensureNoModal', () => {
  const SELS = [
    // genéricos
    '[role="dialog"]',
    '.modal',
    '.modal-backdrop',
    '.ReactModal__Overlay',
    '.swal2-container',
    '.ant-modal-root',
    '.MuiBackdrop-root',
    '.ant-drawer-mask',
    // overlay tailwind típico del sitio: fixed + inset-0 + bg-opacity
    'div.fixed.inset-0.bg-black.bg-opacity-50',
    // variante flexible por si cambian las clases
    'div[class*="fixed"][class*="inset-0"][class*="bg-opacity"]',
  ];
  const JOIN = SELS.join(',');

  // 1) eliminar lo presente ahora
  cy.window({ log: false }).then((win) => {
    const nodes = win.document.querySelectorAll<HTMLElement>(JOIN);
    nodes.forEach((el) => {
      try { el.remove(); } catch { /* no-op */ return; }
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });

    // 2) inyectar un <style> que lo oculte si lo vuelven a montar
    const STYLE_ID = '__cypress_hide_modal__';
    if (!win.document.getElementById(STYLE_ID)) {
      const style = win.document.createElement('style');
      style.id = STYLE_ID;
      style.appendChild(
        win.document.createTextNode(`
          ${SELS.join(',')}
          { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
          body.modal-open { overflow: auto !important; }
        `)
      );
      win.document.head.appendChild(style);
    }

    try {
      win.document.body.classList.remove('overflow-hidden', 'modal-open');
      win.document.body.style.removeProperty('overflow');
    } catch { /* no-op */ return; }
  });

  // 3) Validación con retry
  cy.get('body', { timeout: 6000 }).should(($b) => {
    expect($b.find(JOIN).length, 'modal/overlay count').to.eq(0);
  });
});

// ---------- Tipos de Cypress ----------
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      /** Cierra/oculta el modal de landing si existe */
      dismissLandingModal(): Chainable<void>;
      /** Elimina overlays y añade CSS para que no reaparezcan en esa carga */
      ensureNoModal(): Chainable<void>;
    }
  }
}

export {};
/* eslint-enable @typescript-eslint/no-namespace */
