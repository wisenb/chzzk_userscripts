// ==UserScript==
// @name         chzzk_knife_tracker
// @namespace    chzzk_knife_tracker
// @version      0.0.1
// @description  칼이나 치지직 인증뱃지를 달고있는 채팅을 채팅창 상단에 모아서 저장합니다
// @author       wisenb
// @match        https://chzzk.naver.com/*
// @grant        none
// @homepage     https://github.com/wisenb/chzzk_userscripts
// @supportURL   https://github.com/wisenb/chzzk_userscripts/issues
// @downloadURL  https://github.com/wisenb/chzzk_userscripts/raw/main/chzzk_knife_tracker/chzzk_knife_tracker.user.js
// @updateURL    https://github.com/wisenb/chzzk_userscripts/raw/main/chzzk_knife_tracker/chzzk_knife_tracker.user.js
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const MAX_MESSAGES = 100;
  const chatContainerSelector = '.live_chatting_list_container__vwsbZ';
  const chatListSelector = '.live_chatting_list_wrapper__a5XTV';
  const welcomeSelector = '.live_chatting_guide_container__vr6hZ.live_chatting_guide_filter__BJDve';
  const liveChatRootSelector = '.live_chatting_container__SvtrD';

  let readyForFiltering = false;
  let currentURI = document.baseURI;

  const style = `
      #filtered-chat-box {
        display: flex;
        flex-direction: column-reverse;
        height: 130px;
        overflow-y: auto;
        padding: 8px 8px 0 8px;
        margin: 0;
        border-bottom: 2px solid #444;
        border-radius: 0 0 6px 6px;
        background-color: rgba(30, 30, 30, 0.8);
        scrollbar-width: thin;
      }
      .live_chatting_list_wrapper__a5XTV {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .live_chatting_list_container__vwsbZ {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .live_chatting_list_fixed__Wy3TT {
        top: 0 !important;
      }
    `;

  function injectStyles(css) {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function createFilteredChatBox() {
    const chatContainer = document.querySelector(chatContainerSelector);
    if (!chatContainer || document.getElementById('filtered-chat-box')) return;

    const filteredBox = document.createElement('div');
    filteredBox.id = 'filtered-chat-box';
    chatContainer.parentElement.insertBefore(filteredBox, chatContainer);
    injectStyles(style);
  }

  function isFilteredUser(node) {
    const admin = node.querySelector('.live_chatting_username_icon__6Dj7b img[alt="채팅 운영자"]');
    const verified = node.querySelector('.live_chatting_username_nickname__dDbbj .blind');
    return admin || (verified && verified.textContent.includes('인증 마크'));
  }

  function isChat(node) {
    return !!node.querySelector('[class^="live_chatting_message_container__"]');
  }

  function observeNewMessages() {
    const chatList = document.querySelector(chatListSelector);
    if (!chatList) return;

    const observer = new MutationObserver((mutations) => {
      const targetMutations = readyForFiltering ? mutations : mutations.slice().reverse();

      targetMutations.forEach((mutation) => {
        Array.from(mutation.addedNodes).forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (!readyForFiltering && node.querySelector?.(welcomeSelector)) {
            readyForFiltering = true;
            return;
          }

          if (!readyForFiltering) return;

          if (node.matches('.live_chatting_list_item__0SGhw') && isChat(node) && isFilteredUser(node)) {
            const filteredBox = document.getElementById('filtered-chat-box');
            if (!filteredBox) return;

            const isAtBottom = filteredBox.scrollTop + filteredBox.clientHeight >= filteredBox.scrollHeight - 5;

            const cloned = node.cloneNode(true);
            filteredBox.insertBefore(cloned, filteredBox.firstChild);

            while (filteredBox.children.length > MAX_MESSAGES) {
              filteredBox.removeChild(filteredBox.lastChild);
            }

            if (isAtBottom) {
              filteredBox.scrollTop = filteredBox.scrollHeight;
            }
          }
        });
      });
    });

    observer.observe(chatList, { childList: true, subtree: true });
  }

  function init() {
    readyForFiltering = false;
    createFilteredChatBox();
    observeNewMessages();
  }

  function observePageChanges() {
    const titleNode = document.querySelector('title');
    if (!titleNode) return;

    const observer = new MutationObserver(() => {
      if (document.baseURI !== currentURI) {
        currentURI = document.baseURI;
        waitForLiveChatThenInit();
      }
    });

    observer.observe(titleNode, { childList: true });
  }

  function waitForLiveChatThenInit() {
    const check = setInterval(() => {
      const ready = document.querySelector(chatContainerSelector) && document.querySelector(chatListSelector) && document.querySelector(liveChatRootSelector);
      if (ready) {
        clearInterval(check);
        init();
      }
    }, 500);
  }

  window.addEventListener('load', () => {
    waitForLiveChatThenInit();
    observePageChanges();
  });
})();
