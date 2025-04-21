// ==UserScript==
// @name         chzzk_quality_fix
// @namespace    chzzk_quality_fix
// @version      0.0.2
// @description  화질이 항상 최대로 설정되게 하고 광고 차단 팝업을 삭제합니다. 단축키: F(전체화면), M(음소거), T(뷰모드), Space/K(재생/일시정지)
// @author       wisenb
// @match        https://chzzk.naver.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  function triggerClick(element) {
    if (element) {
      element.click();
      let event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      element.dispatchEvent(event);
      let enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' });
      element.dispatchEvent(enterEvent);
    }
  }

  function selectBestAvailableQuality() {
    let settingButton = document.querySelector('.pzp-setting-button');
    if (!settingButton) return;

    triggerClick(settingButton);

    const qualityObserver = new MutationObserver(() => {
      let qualityButton = document.querySelector('.pzp-setting-intro-quality');
      if (qualityButton) {
        triggerClick(qualityButton);

        const itemObserver = new MutationObserver(() => {
          let qualityItems = document.querySelectorAll('.pzp-ui-setting-quality-item.pzp-ui-setting-pane-item');
          if (qualityItems.length > 0) {
            let targetQuality =
              Array.from(qualityItems).find((item) => item.textContent.trim().startsWith('1080p')) || Array.from(qualityItems).find((item) => item.textContent.trim().startsWith('720p'));

            if (targetQuality) {
              triggerClick(targetQuality);
              let innerButton = targetQuality.querySelector('div') || targetQuality.querySelector('span');
              if (innerButton) triggerClick(innerButton);
            }
            itemObserver.disconnect();
          }
        });

        itemObserver.observe(document.body, { childList: true, subtree: true });
        qualityObserver.disconnect();
      }
    });

    qualityObserver.observe(document.body, { childList: true, subtree: true });
  }

  function initAutoQualitySelection() {
    const observer = new MutationObserver((mutations, obs) => {
      let settingButton = document.querySelector('.pzp-setting-button');
      if (settingButton) {
        selectBestAvailableQuality();
        obs.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const style = document.createElement('style');
    style.innerHTML = `
          .pzp-setting-pane,
          .pzp-setting-quality-pane,
          .pzp-settings { display: none !important; }
      `;
    document.head.appendChild(style);
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  }

  function observeAndHidePopup() {
    const observer = new MutationObserver(() => {
      const popups = document.querySelectorAll('.popup_dimmed__zs78t');
      popups.forEach((popup) => {
        const strongTag = popup.querySelector('strong');
        if (strongTag && strongTag.textContent.includes('광고 차단 프로그램')) {
          popup.style.display = 'none';
          if (document.body.hasAttribute('style')) {
            document.body.removeAttribute('style');
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function observeUrlChange(callback) {
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (currentUrl.includes('/live/')) {
          callback();
          observeAndHidePopup();
        }
      }
    }).observe(document, { childList: true, subtree: true });

    window.addEventListener('popstate', () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (currentUrl.includes('/live/')) {
          callback();
          observeAndHidePopup();
        }
      }
    });
  }

  /** 단축키: F(전체화면), M(음소거), T(뷰모드), Space/K(재생/일시정지) */
  function globalShortcut(e) {
    const textBox = document.querySelector('.live_chatting_input_input__2F3Et');
    const searchBox = document.querySelector('.search_input__tKVgq');
    const donationBox = document.querySelector('.live_chatting_donation_message_input__3X7ug');

    if (document.activeElement === textBox || document.activeElement === searchBox || document.activeElement === donationBox) {
      e.stopPropagation();
      if (e.code === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (!(e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)) {
      switch (e.code) {
        case 'KeyM': {
          const video = document.querySelector('.webplayer-internal-video');
          if (video) video.muted = !video.muted;
          return;
        }
        case 'KeyF': {
          const fullBtn = document.querySelector('.pzp-pc-fullscreen-button');
          if (fullBtn) fullBtn.click();
          return;
        }
        case 'KeyT': {
          const viewBtn = document.querySelector('.pzp-pc__viewmode-button');
          if (viewBtn) viewBtn.click();
          return;
        }
        case 'Space':
        case 'KeyK': {
          const video = document.querySelector('.webplayer-internal-video');
          if (video) {
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
            e.preventDefault(); // 스페이스 기본 동작(스크롤) 방지
          }
          return;
        }
      }
    }
  }

  document.addEventListener('keydown', globalShortcut);

  initAutoQualitySelection();
  observeAndHidePopup();
  observeUrlChange(initAutoQualitySelection);
})();
