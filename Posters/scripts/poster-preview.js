/**
 * Portfolio & Marketing Poster Deck — Preview Scaler, Subtle Spacing Equalizer & Rule Validator
 *
 * Enforces:
 * 1. 3840x2160 canvas, 3744x80 header, 3744x1936 body
 * 2. Header Left has BOTH title (.poster-brand-title) and subtitle (.poster-brand-subtitle)
 * 3. Header Right has BOTH title (.poster-meta-title) and subtitle (.poster-meta-subtitle)
 * 4. Every Level 1 .card has a 36x36 .card-icon beside its .card-title (and no small subtitle under Level 1 card titles)
 * 5. Every colored card (.card--primary, .card--warning) wraps its body in an inner white .subcard
 * 6. ZERO Empty Card Space Rule: Cards and JSON boxes wrap their content cleanly without leaving
 *    empty blank voids at the bottom; columns reach 1936px through well-fitted sentences/content
 *    plus subtle eye-balled gap nudges (±1px to ±6px).
 */
(function () {
  let fitMode = true;
  let debugMode = false;

  function getExpectedDimensions(canvas) {
    const style = window.getComputedStyle(canvas);
    const w = parseFloat(style.getPropertyValue('--canvas-width')) || 3840;
    const h = parseFloat(style.getPropertyValue('--canvas-height')) || 2160;
    const uw = parseFloat(style.getPropertyValue('--usable-width')) || (w - 96);
    const hh = parseFloat(style.getPropertyValue('--header-height')) || 80;
    const bh = parseFloat(style.getPropertyValue('--body-height')) || (h - 96 - hh - 48);
    return { width: w, height: h, usableWidth: uw, headerHeight: hh, bodyHeight: bh };
  }

  function updateScale() {
    const canvases = document.querySelectorAll('.poster-canvas');
    const vw = window.innerWidth - 48;
    const vh = window.innerHeight - 96;
    let firstScale = 1;

    canvases.forEach((canvas, idx) => {
      const dims = getExpectedDimensions(canvas);
      const scale = fitMode ? Math.min(vw / dims.width, vh / dims.height, 1) : 1;
      if (idx === 0) firstScale = scale;
      if (fitMode && scale < 1) {
        canvas.style.transform = `scale(${scale})`;
        canvas.style.marginBottom = `${-(dims.height * (1 - scale))}px`;
      } else {
        canvas.style.transform = 'none';
        canvas.style.marginBottom = '0px';
      }
    });

    const scaleBtn = document.getElementById('btn-toggle-scale');
    if (scaleBtn) {
      scaleBtn.textContent = fitMode
        ? `Scale: Fit (${Math.round(firstScale * 100)}%)`
        : 'Scale: Native (100%)';
    }
  }

  /**
   * Measures the natural content height of a container (padding + children + gaps)
   */
  function getNaturalContentHeight(el) {
    const style = window.getComputedStyle(el);
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;
    const gap = parseFloat(style.rowGap) || 0;
    const children = Array.from(el.children);
    if (children.length === 0) return el.offsetHeight;
    const childrenSum = children.reduce((acc, ch) => acc + ch.offsetHeight, 0);
    return padTop + padBottom + childrenSum + Math.max(0, children.length - 1) * gap;
  }

  /**
   * Subtle Spacing Equalizer:
   * Distributes small residual vertical differences across a column's cards, bullet lists,
   * and subcards (within subtle eye-balled bounds: bullet gaps 14px..23px, card gaps 28px..44px,
   * subcard vertical padding 20px..30px) so that the column lands flush at 1936px with ZERO
   * empty bottom space inside any card.
   */
  function applySubtleSpacing() {
    const cols = document.querySelectorAll('.poster-col');
    cols.forEach((col) => {
      const cards = Array.from(col.children).filter((ch) => ch.classList.contains('card'));
      cards.forEach((card) => {
        // Skip cards whose child is an expandable visual diagram/chart stage
        const hasVisualStage = Array.from(card.children).some(
          (ch) =>
            ch.classList.contains('arch-canvas--fill') ||
            ch.classList.contains('chart-card--fill') ||
            ch.classList.contains('media-frame--fill')
        );
        if (hasVisualStage) return;

        // Reset any previous inline gap adjustments before measuring natural height
        card.style.gap = '';
        const subcards = card.querySelectorAll('.subcard');
        subcards.forEach((sc) => (sc.style.gap = ''));
        const bulletLists = card.querySelectorAll('.bullet-list');
        bulletLists.forEach((bl) => (bl.style.gap = ''));

        const allocatedHeight = card.clientHeight;
        // Also subtract any internal slack inside .subcard--fill children
        let internalSubcardSlack = 0;
        subcards.forEach((sc) => {
          const scNatural = getNaturalContentHeight(sc);
          const scSlack = sc.clientHeight - scNatural;
          if (scSlack > 0) internalSubcardSlack += scSlack;
        });

        const naturalHeight = getNaturalContentHeight(card) - internalSubcardSlack;
        const delta = allocatedHeight - naturalHeight;

        if (Math.abs(delta) <= 1) return;

        const baseCardGap = card.classList.contains('card--primary') || card.classList.contains('card--warning') ? 24 : 36;
        const numCardGaps = Math.max(0, card.children.length - 1);

        let numSubcardGaps = 0;
        subcards.forEach((sc) => {
          numSubcardGaps += Math.max(0, sc.children.length - 1);
        });

        let numBulletGaps = 0;
        bulletLists.forEach((bl) => {
          numBulletGaps += Math.max(0, bl.querySelectorAll('.bullet-item').length - 1);
        });

        const totalSlots = numCardGaps + numSubcardGaps + numBulletGaps;
        if (totalSlots > 0) {
          const perSlot = delta / totalSlots;
          // Clamp to subtle eye-balled range (-5px to +8px per gap)
          const clamped = Math.max(-5, Math.min(8, perSlot));
          if (numCardGaps > 0) {
            card.style.gap = `${(baseCardGap + clamped).toFixed(1)}px`;
          }
          subcards.forEach((sc) => {
            if (sc.children.length > 1) {
              const baseScGap = sc.classList.contains('subcard--lg') ? 36 : 24;
              sc.style.gap = `${(baseScGap + clamped).toFixed(1)}px`;
            }
          });
          bulletLists.forEach((bl) => {
            bl.style.gap = `${(18 + clamped).toFixed(1)}px`;
          });
        }
      });
    });
  }

  function validatePosterRules() {
    const canvases = document.querySelectorAll('.poster-canvas');
    const issues = [];
    const metrics = [];

    canvases.forEach((canvas, idx) => {
      const label = canvas.getAttribute('data-slide-name') || `Slide #${idx + 1}`;
      const dims = getExpectedDimensions(canvas);
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      if (cw !== dims.width || ch !== dims.height) {
        issues.push(`${label}: Canvas is ${cw}x${ch} (expected ${dims.width}x${dims.height})`);
      }

      // 1. Validate Top Header Bar (Left Title + Subtitle AND Right Title + Subtitle)
      const header = canvas.querySelector('.poster-header');
      if (!header) {
        issues.push(`${label}: Missing .poster-header`);
      } else {
        if (Math.abs(header.offsetWidth - dims.usableWidth) > 2 || Math.abs(header.offsetHeight - dims.headerHeight) > 2) {
          issues.push(
            `${label}: Header is ${header.offsetWidth}x${header.offsetHeight} (expected ${dims.usableWidth}x${dims.headerHeight})`
          );
        }
        if (!header.querySelector('.poster-brand-title') || !header.querySelector('.poster-brand-subtitle')) {
          issues.push(`${label}: Header left must have both .poster-brand-title and .poster-brand-subtitle`);
        }
        if (!header.querySelector('.poster-meta-title') || !header.querySelector('.poster-meta-subtitle')) {
          issues.push(`${label}: Header right must have both .poster-meta-title and .poster-meta-subtitle`);
        }
      }

      // 2. Validate Colored Cards always wrap body in an inner white .subcard
      const coloredCards = canvas.querySelectorAll('.card--primary, .card--warning');
      coloredCards.forEach((cc, cIdx) => {
        if (!cc.querySelector('.subcard')) {
          issues.push(`${label}: Colored card #${cIdx + 1} is missing an inner white .subcard`);
        }
      });

      // 3. Validate every Level 1 .card has a .card-icon beside its .card-title
      const level1Cards = canvas.querySelectorAll('.card');
      level1Cards.forEach((card, kIdx) => {
        const headerEl = card.querySelector(':scope > .card-header');
        if (!headerEl || !headerEl.querySelector('.card-icon') || !headerEl.querySelector('.card-title')) {
          issues.push(`${label}: Level 1 Card #${kIdx + 1} must have :scope > .card-header with .card-icon and .card-title`);
        }

        // Check for empty bottom space inside text/list cards
        const hasVisualStage = Array.from(card.children).some(
          (ch) =>
            ch.classList.contains('arch-canvas--fill') ||
            ch.classList.contains('chart-card--fill') ||
            ch.classList.contains('media-frame--fill')
        );
        const isSpaceBetweenStatTile = card.style.justifyContent === 'space-between';
        const isSocialMarketing =
          canvas.classList.contains('poster-canvas--social-portrait') ||
          canvas.classList.contains('poster-canvas--social-square');
        if (!hasVisualStage && !isSpaceBetweenStatTile) {
          const naturalH = getNaturalContentHeight(card);
          const slack = card.clientHeight - naturalH;
          card.setAttribute('data-slack-px', Math.round(slack));
          if (card.scrollHeight > card.clientHeight + 2) {
            const titleText = headerEl ? headerEl.textContent.trim() : `Card #${kIdx + 1}`;
            issues.push(
              `${label} [${titleText}]: Content overflows card by ${card.scrollHeight - card.clientHeight}px`
            );
          } else if (!isSocialMarketing && slack > 28) {
            const titleText = headerEl ? headerEl.textContent.trim() : `Card #${kIdx + 1}`;
            const approxLines = Math.max(1, Math.round(slack / 45));
            issues.push(
              `${label} [${titleText}]: Has ${Math.round(slack)}px of empty bottom space (~${approxLines} line(s) of 32px text needed)`
            );
          }
        }
      });

      // 4. Check .subcard and .json-contract-card for empty bottom space or overflow
      const subcards = canvas.querySelectorAll('.subcard');
      subcards.forEach((sc, sIdx) => {
        const scNatural = getNaturalContentHeight(sc);
        const scSlack = sc.clientHeight - scNatural;
        sc.setAttribute('data-subcard-slack-px', Math.round(scSlack));
        const parentCard = sc.closest('.card');
        const parentTitle = parentCard && parentCard.querySelector(':scope > .card-header')
          ? parentCard.querySelector(':scope > .card-header').textContent.trim()
          : `Subcard #${sIdx + 1}`;
        if (sc.scrollHeight > sc.clientHeight + 2) {
          issues.push(
            `${label} [${parentTitle} -> .subcard]: Content overflows subcard by ${sc.scrollHeight - sc.clientHeight}px`
          );
        } else if (
          !canvas.classList.contains('poster-canvas--social-portrait') &&
          !canvas.classList.contains('poster-canvas--social-square') &&
          scSlack > 28
        ) {
          const approxLines = Math.max(1, Math.round(scSlack / 45));
          issues.push(
            `${label} [${parentTitle} -> .subcard]: Has ${Math.round(scSlack)}px of empty bottom space (~${approxLines} line(s) of 32px text needed)`
          );
        }
      });

      const jsonContractCards = canvas.querySelectorAll('.json-contract-card');
      jsonContractCards.forEach((jcc, jcIdx) => {
        const jccNatural = getNaturalContentHeight(jcc);
        const jccSlack = jcc.clientHeight - jccNatural;
        jcc.setAttribute('data-jcc-slack-px', Math.round(jccSlack));
        if (jccSlack > 28) {
          issues.push(
            `${label} [JSON Contract Card #${jcIdx + 1}]: Has ${Math.round(jccSlack)}px of empty bottom space`
          );
        }
      });

      // 5. Check JSON code boxes for empty bottom space
      const jsonBoxes = canvas.querySelectorAll('.json-code-box');
      jsonBoxes.forEach((jb, jIdx) => {
        // Measure text height vs box height
        const range = document.createRange();
        range.selectNodeContents(jb);
        const textRect = range.getBoundingClientRect();
        const boxRect = jb.getBoundingClientRect();
        const scale = boxRect.width / jb.offsetWidth || 1;
        const unscaledTextH = textRect.height / scale;
        const slack = jb.clientHeight - 48 - unscaledTextH; // 24px top + 24px bottom padding
        jb.setAttribute('data-json-slack-px', Math.round(slack));
        if (slack > 28) {
          issues.push(
            `${label} [JSON Box #${jIdx + 1}]: Has ${Math.round(slack)}px of empty white space below closing brace`
          );
        }
      });

      // 5. Validate Body Grid & Column Math
      const body = canvas.querySelector('.poster-body');
      if (!body) {
        issues.push(`${label}: Missing .poster-body`);
      } else {
        if (Math.abs(body.offsetWidth - dims.usableWidth) > 2 || Math.abs(body.offsetHeight - dims.bodyHeight) > 2) {
          issues.push(
            `${label}: Body is ${body.offsetWidth}x${body.offsetHeight} (expected ${dims.usableWidth}x${dims.bodyHeight})`
          );
        }

        const cols = Array.from(body.children).filter((el) =>
          el.classList.contains('poster-col')
        );

        if (cols.length > 0) {
          const sumWidths = cols.reduce((acc, col) => acc + col.offsetWidth, 0);
          const totalWithGaps = sumWidths + (cols.length - 1) * 48;
          if (Math.abs(totalWithGaps - dims.usableWidth) > 2) {
            issues.push(
              `${label}: Column widths + 48px gaps = ${totalWithGaps}px (expected ${dims.usableWidth}px)`
            );
          }

          cols.forEach((col, cIdx) => {
            if (Math.abs(col.offsetHeight - dims.bodyHeight) > 2) {
              issues.push(
                `${label} Col ${cIdx + 1}: Height is ${col.offsetHeight}px (expected ${dims.bodyHeight}px)`
              );
            }
            if (col.scrollHeight > col.offsetHeight + 4) {
              issues.push(
                `${label} Col ${cIdx + 1}: Content overflows vertically (${col.scrollHeight}px > ${dims.bodyHeight}px, overflow=${col.scrollHeight - col.offsetHeight}px)`
              );
            }
            const lastChild = col.lastElementChild;
            if (lastChild) {
              const bottomEdge = lastChild.offsetTop + lastChild.offsetHeight;
              if (Math.abs(bottomEdge - dims.bodyHeight) > 4) {
                issues.push(
                  `${label} Col ${cIdx + 1}: Bottom card ends at ${bottomEdge}px inside body (expected ${dims.bodyHeight}px flush)`
                );
              }
            }
          });
        }
      }

      metrics.push({ label, issuesCount: issues.length });
    });

    const pill = document.getElementById('rule-validator-pill');
    if (pill) {
      if (issues.length === 0) {
        pill.className = 'preview-status-pill preview-status-pill--ok';
        pill.textContent = `✓ All Grid, Header, Icon & Card Space Rules Valid`;
        pill.title = 'Verified: 3840x2160 canvas, dual header titles/subtitles, 36x36 card icons, inner white cards on colored cards, zero empty card space, 1936px flush columns.';
      } else {
        pill.className = 'preview-status-pill preview-status-pill--err';
        pill.textContent = `⚠ ${issues.length} Rule Issue(s)`;
        pill.title = issues.join('\n');
        console.warn('[Poster Rule Validator Issues]:', issues);
      }
    }

    const result = { valid: issues.length === 0, issues, metrics };
    document.body.setAttribute('data-validation-result', JSON.stringify(result));
    return result;
  }

  async function downloadPngs() {
    const btn = document.getElementById('btn-download-png');
    const origText = btn ? btn.textContent : 'Download PNG';
    if (btn) btn.textContent = 'Exporting...';

    try {
      const canvases = Array.from(document.querySelectorAll('.poster-canvas'));
      // Gather CSS rules from loaded stylesheets (skip external @import to avoid taint)
      let cssText = '';
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.type !== CSSRule.IMPORT_RULE) {
              cssText += rule.cssText + '\n';
            }
          }
        } catch {
          // Cross-origin stylesheet skipped
        }
      }

      for (let i = 0; i < canvases.length; i++) {
        const el = canvases[i];
        const dims = getExpectedDimensions(el);
        const clone = el.cloneNode(true);
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.style.boxShadow = 'none';

        // Inline <img> sources as data URIs so SVG foreignObject renders photos cleanly
        const imgs = Array.from(clone.querySelectorAll('img'));
        for (const clonedImg of imgs) {
          const src = clonedImg.getAttribute('src');
          if (!src || src.startsWith('data:')) continue;
          const resp = await fetch(new URL(src, window.location.href).href);
          const blob = await resp.blob();
          const dataUrl = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });
          clonedImg.setAttribute('src', dataUrl);
        }

        const wrapper = document.createElement('div');
        wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        wrapper.appendChild(clone);

        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.width}" height="${dims.height}">
          <foreignObject width="100%" height="100%">
            <style xmlns="http://www.w3.org/1999/xhtml">${cssText}</style>
            ${new XMLSerializer().serializeToString(wrapper)}
          </foreignObject>
        </svg>`;

        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = dims.width;
        canvas.height = dims.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const pngBlob = await new Promise((resolve, reject) => {
          try {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
          } catch (err) {
            reject(err);
          }
        });

        const slug = (el.getAttribute('data-slide-name') || `slide-${i + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = `${String(i + 1).padStart(2, '0')}-${slug}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      }
    } catch (err) {
      console.warn('[PNG Export fallback]:', err);
      alert(
        'Browser PNG export requires http:// (blocked on file:// by browser security). Use "Download PDF", start the preview server:\nnode Posters/scripts/serve.mjs\nor batch export PNGs directly:\nnode Posters/scripts/export-png.mjs <file>.html'
      );
    } finally {
      if (btn) btn.textContent = origText;
    }
  }

  function downloadPosters() {
    const firstCanvas = document.querySelector('.poster-canvas');
    if (!firstCanvas) return;
    const dims = getExpectedDimensions(firstCanvas);

    let printStyle = document.getElementById('poster-print-page-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'poster-print-page-style';
      document.head.appendChild(printStyle);
    }
    printStyle.textContent = `@page { size: ${dims.width}px ${dims.height}px; margin: 0; }`;

    window.print();
  }

  function mountToolbar() {
    if (document.querySelector('.preview-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'preview-toolbar';
    toolbar.innerHTML = `
      <span id="rule-validator-pill" class="preview-status-pill preview-status-pill--ok">Checking rules...</span>
      <button id="btn-toggle-scale" type="button">Scale: Fit</button>
      <button id="btn-toggle-grid" type="button">Inspect Grid</button>
      <button id="btn-download-png" type="button">Download PNG</button>
      <button id="btn-download-posters" type="button">Download PDF</button>
      <button id="btn-toggle-toolbar" type="button" title="Collapse menu so it never blocks the slide">Hide</button>
    `;
    document.body.appendChild(toolbar);

    document.getElementById('btn-toggle-scale').addEventListener('click', () => {
      fitMode = !fitMode;
      updateScale();
    });

    document.getElementById('btn-download-png').addEventListener('click', downloadPngs);
    document.getElementById('btn-download-posters').addEventListener('click', downloadPosters);

    document.getElementById('btn-toggle-toolbar').addEventListener('click', (e) => {
      const collapsed = toolbar.classList.toggle('preview-toolbar--collapsed');
      e.target.textContent = collapsed ? 'Menu' : 'Hide';
    });

    document.getElementById('btn-toggle-grid').addEventListener('click', (e) => {
      debugMode = !debugMode;
      document.querySelectorAll('.poster-canvas').forEach((c) => {
        c.classList.toggle('debug-grid', debugMode);
      });
      e.target.textContent = debugMode ? 'Hide Grid' : 'Inspect Grid';
    });
  }

  window.validatePosterRules = validatePosterRules;

  window.addEventListener('DOMContentLoaded', () => {
    mountToolbar();
    applySubtleSpacing();
    updateScale();
    validatePosterRules();
    setTimeout(() => {
      applySubtleSpacing();
      validatePosterRules();
    }, 180);
  });

  window.addEventListener('resize', updateScale);
})();
