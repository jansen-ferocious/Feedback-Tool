(function() {
  'use strict';

  // Get configuration from script tag (must do this before DOM ready)
  const currentScript = document.currentScript || document.querySelector('script[data-project]');
  const projectApiKey = currentScript?.getAttribute('data-project');
  const supabaseUrl = currentScript?.getAttribute('data-supabase-url') || 'https://dpxxmxrnwlaryuyachrn.supabase.co';
  const supabaseAnonKey = currentScript?.getAttribute('data-supabase-anon-key') || 'sb_publishable_-oOglFln8xO5hO2ThiMHeA_yGBSIuhv';

  // Get base URL from script src for logo
  const scriptSrc = currentScript?.src || '';
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  const logoUrl = currentScript?.getAttribute('data-logo') || `${baseUrl}/logo.png`;

  if (!projectApiKey) {
    console.error('Feedback Widget: Missing data-project attribute');
    return;
  }

  // Storage key for user preferences
  const STORAGE_KEY = 'fb_widget_user';

  // Load/save user from localStorage
  function getSavedUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function saveUser(name, email) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email }));
    } catch {
      // Ignore storage errors
    }
  }

  function clearUser() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  // Load html2canvas from CDN
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Wait for DOM to be ready
  function init() {
    // Styles
  const styles = `
    .fb-widget-button {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(157, 38, 123, 0.4);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .fb-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(157, 38, 123, 0.5);
    }
    .fb-widget-button.selecting {
      animation: fb-pulse 1.5s infinite;
    }
    @keyframes fb-pulse {
      0%, 100% { box-shadow: 0 4px 12px rgba(157, 38, 123, 0.4); }
      50% { box-shadow: 0 4px 24px rgba(106, 71, 157, 0.7); }
    }
    .fb-widget-button svg {
      width: 24px;
      height: 24px;
    }
    .fb-widget-panel {
      position: fixed;
      bottom: 90px;
      left: 20px;
      width: 340px;
      max-width: calc(100vw - 40px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    .fb-widget-panel.active {
      display: block;
      animation: fb-slide-up 0.2s ease-out;
    }
    @keyframes fb-slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fb-widget-header {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fb-widget-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .fb-widget-close:hover {
      opacity: 1;
    }
    .fb-widget-body {
      padding: 16px;
    }
    .fb-widget-step {
      display: none;
    }
    .fb-widget-step.active {
      display: block;
    }
    .fb-widget-btn {
      width: 100%;
      padding: 12px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .fb-widget-btn-primary {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
    }
    .fb-widget-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(157, 38, 123, 0.3);
    }
    .fb-widget-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .fb-widget-btn-secondary:hover {
      background: #e5e7eb;
    }
    .fb-widget-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .fb-widget-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }
    .fb-widget-input:focus {
      outline: none;
      border-color: #6a479d;
    }
    .fb-widget-input::placeholder {
      color: #9ca3af;
    }
    .fb-widget-textarea {
      min-height: 80px;
      resize: vertical;
    }
    .fb-widget-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    .fb-widget-screenshot {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 8px;
      margin-bottom: 12px;
    }
    .fb-widget-screenshot img {
      width: 100%;
      border-radius: 6px;
      display: block;
    }
    .fb-widget-welcome {
      text-align: center;
      padding: 8px 0;
    }
    .fb-widget-welcome-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 5px;
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .fb-widget-welcome-icon.has-logo {
      width: auto;
      height: auto;
      max-width: 60px;
      background: none;
      border-radius: 0;
    }
    .fb-widget-welcome-icon img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
    .fb-widget-welcome-icon svg {
      width: 32px;
      height: 32px;
      color: white;
    }
    .fb-widget-welcome h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .fb-widget-welcome p {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .fb-widget-user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #f3f4f6;
      border-radius: 10px;
      margin-bottom: 12px;
    }
    .fb-widget-user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6a479d 0%, #a586d0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    .fb-widget-user-info {
      flex: 1;
      text-align: left;
      min-width: 0;
    }
    .fb-widget-user-name {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fb-widget-user-email {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fb-widget-user-change {
      background: none;
      border: none;
      color: #6a479d;
      font-size: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .fb-widget-user-change:hover {
      background: rgba(106, 71, 157, 0.1);
    }
    .fb-widget-success {
      text-align: center;
      padding: 20px 16px;
    }
    .fb-widget-success svg {
      width: 48px;
      height: 48px;
      color: #10b981;
      margin-bottom: 12px;
    }
    .fb-widget-success h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .fb-widget-success p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .fb-highlight-overlay {
      position: fixed;
      pointer-events: none;
      border: 4px solid #000000;
      background: rgba(0, 0, 0, 0.05);
      z-index: 2147483645;
      transition: all 0.1s ease;
      border-radius: 4px;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
    }
    .fb-selecting-mode {
      cursor: crosshair !important;
    }
    .fb-selecting-mode * {
      cursor: crosshair !important;
    }
    .fb-selecting-hint {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .fb-selecting-hint kbd {
      background: rgba(255,255,255,0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    .fb-widget-category {
      display: flex;
      gap: 12px;
      margin-top: 6px;
      margin-bottom: 4px;
    }
    .fb-widget-radio {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      flex: 1;
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .fb-widget-radio:hover {
      border-color: #d1d5db;
    }
    .fb-widget-radio.selected {
      border-color: #d146ac;
      background: rgba(209, 70, 172, 0.05);
    }
    .fb-widget-radio input {
      display: none;
    }
    .fb-widget-radio-dot {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .fb-widget-radio.selected .fb-widget-radio-dot {
      border-color: #d146ac;
    }
    .fb-widget-radio.selected .fb-widget-radio-dot::after {
      content: '';
      width: 10px;
      height: 10px;
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      border-radius: 50%;
    }
    .fb-widget-radio-label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .fb-widget-radio.selected .fb-widget-radio-label {
      color: #111827;
    }
    .fb-quick-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .fb-quick-actions button {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .fb-quick-submit {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
    }
    .fb-quick-submit:hover {
      transform: translateY(-1px);
    }
    .fb-quick-submit:disabled {
      opacity: 0.5;
      transform: none;
    }
    .fb-quick-cancel {
      background: #f3f4f6;
      color: #6b7280;
    }
    .fb-quick-cancel:hover {
      background: #e5e7eb;
    }
    .fb-marker {
      position: absolute;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      cursor: pointer;
      z-index: 2147483640;
      box-shadow: 0 2px 8px rgba(157, 38, 123, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid white;
    }
    .fb-marker:hover {
      transform: rotate(-45deg) scale(1.15);
      box-shadow: 0 4px 12px rgba(157, 38, 123, 0.5);
    }
    .fb-marker-number {
      transform: rotate(45deg);
      color: white;
      font-size: 12px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .fb-marker-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      white-space: nowrap;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .fb-marker-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1f2937;
    }
    .fb-marker:hover .fb-marker-tooltip {
      opacity: 1;
      visibility: visible;
    }
    .fb-marker.status-in-progress {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }
    .fb-marker.status-in-progress:hover {
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5);
    }
    .fb-widget-actions {
      position: fixed;
      bottom: 86px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 2147483646;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.2s ease;
    }
    .fb-widget-actions.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .fb-action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: white;
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .fb-action-btn:hover {
      transform: translateX(4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .fb-action-btn svg {
      width: 20px;
      height: 20px;
      color: #6a479d;
    }
    .fb-action-btn.primary {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
    }
    .fb-action-btn.primary svg {
      color: white;
    }
    .fb-feedback-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 360px;
      max-width: 100vw;
      height: 100vh;
      background: white;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .fb-feedback-sidebar.open {
      transform: translateX(0);
    }
    .fb-sidebar-header {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .fb-sidebar-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .fb-sidebar-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .fb-sidebar-close:hover {
      opacity: 1;
    }
    .fb-sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .fb-sidebar-empty {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    .fb-sidebar-empty svg {
      width: 48px;
      height: 48px;
      color: #d1d5db;
      margin-bottom: 12px;
    }
    .fb-sidebar-empty p {
      margin: 0;
      font-size: 14px;
    }
    .fb-feedback-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .fb-feedback-item:hover {
      border-color: #d146ac;
      box-shadow: 0 2px 8px rgba(209, 70, 172, 0.1);
    }
    .fb-feedback-item:last-child {
      margin-bottom: 0;
    }
    .fb-feedback-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .fb-feedback-item-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .fb-feedback-item-status.not-started {
      background: rgba(209, 70, 172, 0.1);
      color: #d146ac;
    }
    .fb-feedback-item-status.in-progress {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
    .fb-feedback-item-category {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      background: #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .fb-feedback-item-comment {
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .fb-feedback-item-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .fb-feedback-item-meta a {
      color: #6a479d;
      text-decoration: none;
    }
    .fb-feedback-item-meta a:hover {
      text-decoration: underline;
    }
    .fb-sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483646;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    }
    .fb-sidebar-overlay.visible {
      opacity: 1;
      visibility: visible;
    }
    .fb-feedback-count {
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
    }
    .fb-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .fb-detail-overlay.active {
      display: flex;
    }
    .fb-detail-modal {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .fb-detail-header {
      background: linear-gradient(135deg, #d146ac 0%, #6a479d 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fb-detail-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .fb-detail-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .fb-detail-close:hover {
      opacity: 1;
    }
    .fb-detail-content {
      padding: 20px;
      overflow-y: auto;
    }
    .fb-detail-screenshot {
      width: 100%;
      border-radius: 12px;
      margin-bottom: 16px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
    }
    .fb-detail-screenshot:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .fb-detail-comment {
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
    }
    .fb-detail-meta {
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
    }
    .fb-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .fb-detail-row:last-child {
      border-bottom: none;
    }
    .fb-detail-label {
      color: #6b7280;
    }
    .fb-detail-value {
      color: #111827;
      font-weight: 500;
      text-align: right;
    }
    .fb-detail-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .fb-detail-status.not-started {
      background: rgba(209, 70, 172, 0.1);
      color: #d146ac;
    }
    .fb-detail-status.in-progress {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
    .fb-detail-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2147483648;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 40px;
      cursor: pointer;
    }
    .fb-detail-lightbox.active {
      display: flex;
    }
    .fb-detail-lightbox img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .fb-detail-lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .fb-detail-lightbox-close:hover {
      opacity: 1;
    }
    .fb-marker.hidden {
      display: none !important;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // State
  let isOpen = false;
  let isSelecting = false;
  let selectedElement = null;
  let screenshotDataUrl = null;
  let highlightEl = null;
  let hintEl = null;
  let currentUser = getSavedUser();

  // Create widget elements
  const button = document.createElement('button');
  button.className = 'fb-widget-button';
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>`;
  button.title = 'Click to select an element and give feedback';

  const panel = document.createElement('div');
  panel.className = 'fb-widget-panel';
  panel.innerHTML = `
    <div class="fb-widget-header">
      <span id="fb-header-title">Send Feedback</span>
      <button class="fb-widget-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="fb-widget-body">
      <!-- Welcome/Setup Step -->
      <div class="fb-widget-step" data-step="welcome">
        <div class="fb-widget-welcome">
          <div class="fb-widget-welcome-icon" id="fb-welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          </div>
          <h3>Welcome!</h3>
          <p>Spotted something that's not quite right? Let's set you up so your feedback is linked to you.</p>
        </div>
        <label class="fb-widget-label">Your name</label>
        <input type="text" class="fb-widget-input" id="fb-setup-name" placeholder="Jane Smith">
        <label class="fb-widget-label">Your email</label>
        <input type="email" class="fb-widget-input" id="fb-setup-email" placeholder="jane@ferociousmedia.com">
        <button class="fb-widget-btn fb-widget-btn-primary" id="fb-setup-continue">
          Continue
        </button>
      </div>

      <!-- Feedback Form Step -->
      <div class="fb-widget-step" data-step="form">
        <div class="fb-widget-user-badge" id="fb-user-badge">
          <div class="fb-widget-user-avatar" id="fb-user-avatar">J</div>
          <div class="fb-widget-user-info">
            <div class="fb-widget-user-name" id="fb-user-name">Jane Smith</div>
            <div class="fb-widget-user-email" id="fb-user-email">jane@example.com</div>
          </div>
          <button class="fb-widget-user-change" id="fb-change-user">Change</button>
        </div>
        <div class="fb-widget-screenshot" id="fb-screenshot-container" style="display: none;">
          <img id="fb-screenshot-img" src="" alt="Screenshot">
        </div>
        <textarea class="fb-widget-input fb-widget-textarea" id="fb-comment" placeholder="What's the issue or suggestion?"></textarea>
        <label class="fb-widget-label" style="margin-top: 12px;">Assign Feedback To:</label>
        <div class="fb-widget-category">
          <label class="fb-widget-radio selected" id="fb-cat-dev">
            <input type="radio" name="fb-category" value="dev" checked>
            <span class="fb-widget-radio-dot"></span>
            <span class="fb-widget-radio-label">Dev</span>
          </label>
          <label class="fb-widget-radio" id="fb-cat-content">
            <input type="radio" name="fb-category" value="content">
            <span class="fb-widget-radio-dot"></span>
            <span class="fb-widget-radio-label">Content</span>
          </label>
        </div>
        <div class="fb-quick-actions">
          <button class="fb-quick-cancel" id="fb-cancel">Cancel</button>
          <button class="fb-quick-submit" id="fb-submit">Send</button>
        </div>
      </div>

      <!-- Success Step -->
      <div class="fb-widget-step" data-step="success">
        <div class="fb-widget-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
          <h3>Thanks!</h3>
          <p>Your feedback has been sent. Stay on the prowl and pounce on anything else you see.</p>
        </div>
        <button class="fb-widget-btn fb-widget-btn-secondary" id="fb-new-feedback">Send More</button>
      </div>
    </div>
  `;

  // Create action buttons container
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'fb-widget-actions';
  actionsContainer.innerHTML = `
    <button class="fb-action-btn" id="fb-action-toggle-markers">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" id="fb-markers-icon-show" style="display: none;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" id="fb-markers-icon-hide">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      </svg>
      <span id="fb-markers-label">Hide Markers</span>
    </button>
    <button class="fb-action-btn" id="fb-action-view">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
      View Feedback
      <span class="fb-feedback-count" id="fb-feedback-count" style="display: none;">0</span>
    </button>
    <button class="fb-action-btn primary" id="fb-action-submit">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
      </svg>
      Submit Feedback
    </button>
  `;

  // Create sidebar overlay
  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'fb-sidebar-overlay';

  // Create feedback sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'fb-feedback-sidebar';
  sidebar.innerHTML = `
    <div class="fb-sidebar-header">
      <h2>Active Feedback</h2>
      <button class="fb-sidebar-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="fb-sidebar-content" id="fb-sidebar-content">
      <div class="fb-sidebar-empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>No active feedback for this page</p>
      </div>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(actionsContainer);
  document.body.appendChild(sidebarOverlay);
  document.body.appendChild(sidebar);
  document.body.appendChild(panel);

  // Create feedback detail modal
  const detailOverlay = document.createElement('div');
  detailOverlay.className = 'fb-detail-overlay';
  detailOverlay.innerHTML = `
    <div class="fb-detail-modal">
      <div class="fb-detail-header">
        <h2>Feedback Details</h2>
        <button class="fb-detail-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="fb-detail-content" id="fb-detail-content">
      </div>
    </div>
  `;
  document.body.appendChild(detailOverlay);

  // Create lightbox for screenshot
  const detailLightbox = document.createElement('div');
  detailLightbox.className = 'fb-detail-lightbox';
  detailLightbox.innerHTML = `
    <button class="fb-detail-lightbox-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    <img id="fb-lightbox-img" src="" alt="Screenshot">
  `;
  document.body.appendChild(detailLightbox);

  // State for markers visibility
  let markersVisible = true;

  // Check if widget is active for this project
  async function checkWidgetActive() {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/projects?api_key=eq.${projectApiKey}&select=widget_active`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      const projects = await response.json();
      if (projects && projects.length > 0) {
        // If widget_active is explicitly false, hide everything
        if (projects[0].widget_active === false) {
          button.style.display = 'none';
          actionsContainer.style.display = 'none';
          sidebarOverlay.style.display = 'none';
          sidebar.style.display = 'none';
          panel.style.display = 'none';
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to check widget status:', err);
      return true; // Default to showing widget on error
    }
  }

  // Check widget status and hide if disabled
  checkWidgetActive();

  // Set welcome icon to logo if provided
  if (logoUrl) {
    const welcomeIcon = document.getElementById('fb-welcome-icon');
    welcomeIcon.classList.add('has-logo');
    welcomeIcon.innerHTML = `<img src="${logoUrl}" alt="Logo">`;
  }

  // Create highlight element
  highlightEl = document.createElement('div');
  highlightEl.className = 'fb-highlight-overlay';
  highlightEl.style.display = 'none';
  document.body.appendChild(highlightEl);

  // Create hint element
  hintEl = document.createElement('div');
  hintEl.className = 'fb-selecting-hint';
  hintEl.innerHTML = 'Click any element to submit feedback, press <kbd>ESC</kbd> to cancel';
  hintEl.style.display = 'none';
  document.body.appendChild(hintEl);

  // Functions
  function updateUserBadge() {
    if (currentUser) {
      document.getElementById('fb-user-avatar').textContent = currentUser.name?.[0]?.toUpperCase() || '?';
      document.getElementById('fb-user-name').textContent = currentUser.name || 'Unknown';
      document.getElementById('fb-user-email').textContent = currentUser.email || '';
    }
  }

  function showPanel() {
    isOpen = true;
    panel.classList.add('active');
    // Hide actions when panel opens
    if (typeof hideActions === 'function') hideActions();

    if (!currentUser) {
      // Show welcome/setup step
      document.getElementById('fb-header-title').textContent = 'Start Your Feedback Session';
      showStep('welcome');
      setTimeout(() => document.getElementById('fb-setup-name').focus(), 100);
    } else {
      // Show feedback form
      document.getElementById('fb-header-title').textContent = 'Send Feedback';
      updateUserBadge();
      showStep('form');
      setTimeout(() => document.getElementById('fb-comment').focus(), 100);
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('active');
    stopSelecting();
    resetForm();
  }

  function showStep(step) {
    panel.querySelectorAll('.fb-widget-step').forEach(el => el.classList.remove('active'));
    panel.querySelector(`[data-step="${step}"]`).classList.add('active');
  }

  function resetForm() {
    selectedElement = null;
    screenshotDataUrl = null;
    document.getElementById('fb-comment').value = '';
    document.getElementById('fb-screenshot-container').style.display = 'none';
    // Reset category to Dev
    document.getElementById('fb-cat-dev').classList.add('selected');
    document.getElementById('fb-cat-content').classList.remove('selected');
  }

  function startSelecting() {
    isSelecting = true;
    button.classList.add('selecting');
    panel.classList.remove('active');
    document.body.classList.add('fb-selecting-mode');
    hintEl.style.display = 'flex';
    // Hide actions and close sidebar when selecting
    if (typeof hideActions === 'function') hideActions();
    if (typeof closeSidebar === 'function') closeSidebar();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onElementClick, true);
    document.addEventListener('keydown', onKeyDown);
  }

  function stopSelecting() {
    isSelecting = false;
    button.classList.remove('selecting');
    document.body.classList.remove('fb-selecting-mode');
    hintEl.style.display = 'none';
    highlightEl.style.display = 'none';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onElementClick, true);
    document.removeEventListener('keydown', onKeyDown);
  }

  function onMouseMove(e) {
    if (!isSelecting) return;

    const target = e.target;
    if (target === highlightEl || target === hintEl || target === button || panel.contains(target)) return;

    const rect = target.getBoundingClientRect();
    highlightEl.style.display = 'block';
    highlightEl.style.top = rect.top + 'px';
    highlightEl.style.left = rect.left + 'px';
    highlightEl.style.width = rect.width + 'px';
    highlightEl.style.height = rect.height + 'px';
  }

  async function onElementClick(e) {
    if (!isSelecting) return;

    const target = e.target;
    if (target === highlightEl || target === hintEl || target === button || panel.contains(target)) return;

    e.preventDefault();
    e.stopPropagation();

    selectedElement = target;
    stopSelecting();
    await captureScreenshot();
    showPanel();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      stopSelecting();
    }
  }

  function getSelector(element) {
    if (element.id) {
      return '#' + element.id;
    }

    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c => !c.startsWith('fb-'));
        if (classes.length) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }

      const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
      const sameTagSiblings = siblings.filter(s => s.tagName === element.tagName);
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(element) + 1;
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      element = element.parentNode;

      if (path.length >= 4) break;
    }

    return path.join(' > ');
  }

  async function captureScreenshot() {
    try {
      // Load html2canvas if not already loaded
      const html2canvas = await loadHtml2Canvas();

      // Hide widget elements before capture (but keep highlight if element selected)
      button.style.display = 'none';
      hintEl.style.display = 'none';

      // Position highlight on selected element for capture
      if (selectedElement) {
        const rect = selectedElement.getBoundingClientRect();
        highlightEl.style.display = 'block';
        highlightEl.style.top = rect.top + 'px';
        highlightEl.style.left = rect.left + 'px';
        highlightEl.style.width = rect.width + 'px';
        highlightEl.style.height = rect.height + 'px';
      } else {
        highlightEl.style.display = 'none';
      }

      // Capture only the visible viewport
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Hide highlight and show widget button again
      highlightEl.style.display = 'none';
      button.style.display = 'flex';

      screenshotDataUrl = canvas.toDataURL('image/png');

      // Show in panel
      document.getElementById('fb-screenshot-img').src = screenshotDataUrl;
      document.getElementById('fb-screenshot-container').style.display = 'block';

    } catch (err) {
      console.error('Screenshot capture failed:', err);
    }
  }

  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    return browser;
  }

  function getOSInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown';

    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

    return os;
  }

  async function uploadScreenshot(dataUrl) {
    if (!dataUrl) return null;

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const filename = `screenshot-${Date.now()}.png`;

      // Upload to Supabase storage
      const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/screenshots/${filename}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'image/png',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Screenshot upload failed:', errorText);
        return null;
      }

      return `${supabaseUrl}/storage/v1/object/public/screenshots/${filename}`;
    } catch (err) {
      console.error('Screenshot upload error:', err);
      return null;
    }
  }

  async function submitFeedback() {
    const comment = document.getElementById('fb-comment').value.trim();
    const category = document.getElementById('fb-cat-dev').classList.contains('selected') ? 'Dev' : 'Content';

    if (!comment) {
      document.getElementById('fb-comment').focus();
      return;
    }

    const submitBtn = document.getElementById('fb-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    try {
      // First, get the project ID and assignees from the API key
      const projectResponse = await fetch(`${supabaseUrl}/rest/v1/projects?api_key=eq.${projectApiKey}&select=id,dev_assignee_id,content_assignee_id`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      const projects = await projectResponse.json();
      if (!projects || projects.length === 0) {
        throw new Error('Invalid project API key');
      }

      const projectData = projects[0];
      const projectId = projectData.id;

      // Determine auto-assignee based on category
      let assignedTo = null;
      if (category === 'Dev' && projectData.dev_assignee_id) {
        assignedTo = projectData.dev_assignee_id;
      } else if (category === 'Content' && projectData.content_assignee_id) {
        assignedTo = projectData.content_assignee_id;
      }

      // Upload screenshot if available
      const screenshotUrl = await uploadScreenshot(screenshotDataUrl);

      // Prepare feedback data
      const feedbackData = {
        project_id: projectId,
        status: 'not_started',
        assigned_to: assignedTo,
        page_url: window.location.href,
        comment: comment,
        submitter_name: currentUser?.name || null,
        submitter_email: currentUser?.email || null,
        screenshot_url: screenshotUrl,
        element_selector: selectedElement ? getSelector(selectedElement) : null,
        element_html: selectedElement ? selectedElement.outerHTML.substring(0, 500) : null,
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      };

      // Submit feedback
      const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      showStep('success');

      // Auto-close after 2 seconds and reset for next feedback
      setTimeout(() => {
        closePanel();
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
    }
  }

  // State for action menu
  let actionsVisible = false;
  let sidebarOpen = false;
  let isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let hoverTimeout = null;

  function showActions() {
    if (!currentUser) return;
    actionsVisible = true;
    actionsContainer.classList.add('visible');
    updateFeedbackCount();
  }

  function hideActions() {
    actionsVisible = false;
    actionsContainer.classList.remove('visible');
  }

  function openSidebar() {
    sidebarOpen = true;
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
    hideActions();
    loadSidebarFeedback();
  }

  function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
  }

  function openDetailModal(feedback) {
    const contentEl = document.getElementById('fb-detail-content');
    const statusLabel = feedback.status === 'not_started' ? 'Not Started' : 'In Progress';
    const statusClass = feedback.status === 'not_started' ? 'not-started' : 'in-progress';
    const formattedDate = new Date(feedback.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    contentEl.innerHTML = `
      ${feedback.screenshot_url ? `<img src="${feedback.screenshot_url}" alt="Screenshot" class="fb-detail-screenshot" id="fb-detail-screenshot">` : ''}
      ${feedback.comment ? `<div class="fb-detail-comment">${feedback.comment}</div>` : ''}
      <div class="fb-detail-meta">
        <div class="fb-detail-row">
          <span class="fb-detail-label">Status</span>
          <span class="fb-detail-value"><span class="fb-detail-status ${statusClass}">${statusLabel}</span></span>
        </div>
        ${feedback.submitter_name ? `<div class="fb-detail-row">
          <span class="fb-detail-label">Submitted By</span>
          <span class="fb-detail-value">${feedback.submitter_name}</span>
        </div>` : ''}
        <div class="fb-detail-row">
          <span class="fb-detail-label">Submitted</span>
          <span class="fb-detail-value">${formattedDate}</span>
        </div>
        ${feedback.browser ? `<div class="fb-detail-row">
          <span class="fb-detail-label">Browser</span>
          <span class="fb-detail-value">${feedback.browser}</span>
        </div>` : ''}
        ${feedback.os ? `<div class="fb-detail-row">
          <span class="fb-detail-label">OS</span>
          <span class="fb-detail-value">${feedback.os}</span>
        </div>` : ''}
        ${feedback.viewport_width ? `<div class="fb-detail-row">
          <span class="fb-detail-label">Viewport</span>
          <span class="fb-detail-value">${feedback.viewport_width} x ${feedback.viewport_height}</span>
        </div>` : ''}
      </div>
    `;

    detailOverlay.classList.add('active');
    hideActions();

    // Add click handler for screenshot lightbox
    const screenshotEl = document.getElementById('fb-detail-screenshot');
    if (screenshotEl) {
      screenshotEl.addEventListener('click', () => {
        document.getElementById('fb-lightbox-img').src = feedback.screenshot_url;
        detailLightbox.classList.add('active');
      });
    }
  }

  function closeDetailModal() {
    detailOverlay.classList.remove('active');
  }

  function closeLightbox() {
    detailLightbox.classList.remove('active');
  }

  function toggleMarkers() {
    markersVisible = !markersVisible;
    const showIcon = document.getElementById('fb-markers-icon-show');
    const hideIcon = document.getElementById('fb-markers-icon-hide');
    const label = document.getElementById('fb-markers-label');

    if (markersVisible) {
      markers.forEach(m => m.classList.remove('hidden'));
      showIcon.style.display = 'none';
      hideIcon.style.display = 'block';
      label.textContent = 'Hide Markers';
    } else {
      markers.forEach(m => m.classList.add('hidden'));
      showIcon.style.display = 'block';
      hideIcon.style.display = 'none';
      label.textContent = 'Show Markers';
    }
  }

  async function updateFeedbackCount() {
    const feedbackItems = await fetchActiveFeedback();
    const countEl = document.getElementById('fb-feedback-count');
    if (feedbackItems.length > 0) {
      countEl.textContent = feedbackItems.length;
      countEl.style.display = 'flex';
    } else {
      countEl.style.display = 'none';
    }
  }

  async function loadSidebarFeedback() {
    const contentEl = document.getElementById('fb-sidebar-content');
    const feedbackItems = await fetchActiveFeedback();

    if (feedbackItems.length === 0) {
      contentEl.innerHTML = `
        <div class="fb-sidebar-empty">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No active feedback for this page</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = feedbackItems.map((fb, index) => {
      const comment = fb.comment || 'No comment';
      const statusLabel = fb.status === 'not_started' ? 'Not Started' : 'In Progress';
      const statusClass = fb.status === 'not_started' ? 'not-started' : 'in-progress';

      return `
        <div class="fb-feedback-item" data-selector="${fb.element_selector || ''}" data-index="${index}">
          <div class="fb-feedback-item-header">
            <span class="fb-feedback-item-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="fb-feedback-item-comment">${comment}</div>
          <div class="fb-feedback-item-meta">
            <span>#${index + 1}</span>
            ${fb.element_selector ? '<a href="#" class="fb-scroll-to">Scroll to element</a>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners for scroll-to-element
    contentEl.querySelectorAll('.fb-feedback-item').forEach(item => {
      const selector = item.getAttribute('data-selector');
      item.addEventListener('click', (e) => {
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            closeSidebar();
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Flash the element briefly
              const originalOutline = element.style.outline;
              element.style.outline = '3px solid #d146ac';
              setTimeout(() => {
                element.style.outline = originalOutline;
              }, 2000);
            }, 300);
          }
        }
      });
    });
  }

  // Event listeners
  button.addEventListener('click', () => {
    if (isSelecting) {
      stopSelecting();
    } else if (isOpen) {
      closePanel();
    } else if (sidebarOpen) {
      closeSidebar();
    } else {
      // If no user set up, show panel for setup
      if (!currentUser) {
        showPanel();
      } else {
        // On mobile, toggle actions menu
        // On desktop, actions show on hover, so click should start selecting
        if (isMobile) {
          if (actionsVisible) {
            hideActions();
          } else {
            showActions();
          }
        } else {
          startSelecting();
        }
      }
    }
  });

  // Desktop: show actions on hover
  button.addEventListener('mouseenter', () => {
    if (!isMobile && currentUser && !isSelecting && !isOpen && !sidebarOpen) {
      clearTimeout(hoverTimeout);
      showActions();
    }
  });

  button.addEventListener('mouseleave', () => {
    if (!isMobile) {
      hoverTimeout = setTimeout(() => {
        if (!actionsContainer.matches(':hover')) {
          hideActions();
        }
      }, 150);
    }
  });

  actionsContainer.addEventListener('mouseenter', () => {
    if (!isMobile) {
      clearTimeout(hoverTimeout);
    }
  });

  actionsContainer.addEventListener('mouseleave', () => {
    if (!isMobile) {
      hoverTimeout = setTimeout(() => {
        hideActions();
      }, 150);
    }
  });

  // Action button clicks
  document.getElementById('fb-action-submit').addEventListener('click', () => {
    hideActions();
    startSelecting();
  });

  document.getElementById('fb-action-view').addEventListener('click', () => {
    hideActions();
    openSidebar();
  });

  // Sidebar close
  sidebar.querySelector('.fb-sidebar-close').addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Toggle markers
  document.getElementById('fb-action-toggle-markers').addEventListener('click', () => {
    toggleMarkers();
    hideActions();
  });

  // Detail modal close
  detailOverlay.querySelector('.fb-detail-close').addEventListener('click', closeDetailModal);
  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) closeDetailModal();
  });

  // Lightbox close
  detailLightbox.querySelector('.fb-detail-lightbox-close').addEventListener('click', closeLightbox);
  detailLightbox.addEventListener('click', (e) => {
    if (e.target === detailLightbox) closeLightbox();
  });

  panel.querySelector('.fb-widget-close').addEventListener('click', closePanel);

  document.getElementById('fb-cancel').addEventListener('click', closePanel);

  document.getElementById('fb-submit').addEventListener('click', submitFeedback);

  // Category radio buttons
  document.getElementById('fb-cat-dev').addEventListener('click', () => {
    document.getElementById('fb-cat-dev').classList.add('selected');
    document.getElementById('fb-cat-content').classList.remove('selected');
  });
  document.getElementById('fb-cat-content').addEventListener('click', () => {
    document.getElementById('fb-cat-content').classList.add('selected');
    document.getElementById('fb-cat-dev').classList.remove('selected');
  });

  // Submit on Ctrl+Enter or Cmd+Enter
  document.getElementById('fb-comment').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitFeedback();
    }
  });

  // Setup form - continue button
  document.getElementById('fb-setup-continue').addEventListener('click', () => {
    const name = document.getElementById('fb-setup-name').value.trim();
    const email = document.getElementById('fb-setup-email').value.trim();

    if (!name) {
      document.getElementById('fb-setup-name').focus();
      return;
    }
    if (!email) {
      document.getElementById('fb-setup-email').focus();
      return;
    }

    // Save user and proceed
    currentUser = { name, email };
    saveUser(name, email);

    closePanel();
    startSelecting();
  });

  // Allow Enter to proceed in setup form
  document.getElementById('fb-setup-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('fb-setup-continue').click();
    }
  });

  // Change user button
  document.getElementById('fb-change-user').addEventListener('click', () => {
    // Pre-fill with current values
    document.getElementById('fb-setup-name').value = currentUser?.name || '';
    document.getElementById('fb-setup-email').value = currentUser?.email || '';
    document.getElementById('fb-header-title').textContent = 'Update Details';
    showStep('welcome');
    document.getElementById('fb-setup-name').focus();
  });

  document.getElementById('fb-new-feedback').addEventListener('click', () => {
    resetForm();
    closePanel();
    startSelecting();
  });

  // Keyboard shortcut: Ctrl+Shift+F to start selecting
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      if (!isSelecting && !isOpen && !sidebarOpen) {
        if (!currentUser) {
          showPanel();
        } else {
          startSelecting();
        }
      }
    }
    // Escape to close sidebar
    if (e.key === 'Escape' && sidebarOpen) {
      closeSidebar();
    }
  });

  // ==========================================
  // FEEDBACK MARKERS
  // ==========================================

  let markers = [];
  let projectId = null;

  async function getProjectId() {
    if (projectId) return projectId;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/projects?api_key=eq.${projectApiKey}&select=id,widget_active`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      const projects = await response.json();
      if (projects && projects.length > 0) {
        projectId = projects[0].id;
        return projectId;
      }
    } catch (err) {
      console.error('Failed to get project ID:', err);
    }
    return null;
  }

  async function fetchActiveFeedback() {
    const projId = await getProjectId();
    if (!projId) {
      console.log('FB Widget: No project ID found');
      return [];
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/feedback?project_id=eq.${projId}&select=id,comment,status,element_selector,page_url,created_at,submitter_name,browser,os,viewport_width,viewport_height,screenshot_url`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }
      );
      const allFeedback = await response.json();
      console.log('FB Widget: All feedback for project:', allFeedback);

      // Filter for active status and has element_selector
      const active = allFeedback.filter(fb =>
        (fb.status === 'not_started' || fb.status === 'in_progress') &&
        fb.element_selector
      );
      console.log('FB Widget: Active feedback with element_selector:', active);

      // Filter by current page
      const currentPath = window.location.pathname;
      console.log('FB Widget: Current path:', currentPath);
      const filtered = active.filter(fb => {
        try {
          const fbUrl = new URL(fb.page_url);
          const matches = fbUrl.pathname === currentPath;
          console.log('FB Widget: Comparing', fbUrl.pathname, 'to', currentPath, '=', matches);
          return matches;
        } catch {
          const matches = fb.page_url.includes(currentPath);
          console.log('FB Widget: Fallback comparing', fb.page_url, 'includes', currentPath, '=', matches);
          return matches;
        }
      });
      console.log('FB Widget: Filtered feedback for this page:', filtered);
      return filtered;
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      return [];
    }
  }

  function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
  }

  function createMarker(feedback, index) {
    const element = document.querySelector(feedback.element_selector);
    if (!element) return null;

    const marker = document.createElement('div');
    marker.className = `fb-marker ${feedback.status === 'in_progress' ? 'status-in-progress' : ''} ${!markersVisible ? 'hidden' : ''}`;

    const comment = feedback.comment || 'No comment';
    const truncatedComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;

    marker.innerHTML = `
      <span class="fb-marker-number">${index + 1}</span>
      <div class="fb-marker-tooltip">${truncatedComment}</div>
    `;

    // Position the marker
    const rect = element.getBoundingClientRect();
    marker.style.position = 'absolute';
    marker.style.left = `${window.scrollX + rect.left - 14}px`;
    marker.style.top = `${window.scrollY + rect.top - 14}px`;

    // Add click handler to open detail modal
    marker.addEventListener('click', () => {
      openDetailModal(feedback);
    });

    document.body.appendChild(marker);
    return marker;
  }

  function updateMarkerPositions() {
    // Remove and recreate markers to update positions
    loadMarkers();
  }

  async function loadMarkers() {
    clearMarkers();

    const feedbackItems = await fetchActiveFeedback();

    feedbackItems.forEach((feedback, index) => {
      const marker = createMarker(feedback, index);
      if (marker) {
        markers.push(marker);
      }
    });
  }

  // Load markers on init
  loadMarkers();

  // Check for #fb-marker= hash to scroll to element
  function checkHashForMarker() {
    const hash = window.location.hash;
    if (hash.startsWith('#fb-marker=')) {
      const selector = decodeURIComponent(hash.substring(11));
      if (selector) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
          try {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the element
              const originalOutline = element.style.outline;
              const originalOutlineOffset = element.style.outlineOffset;
              element.style.outline = '3px solid #d146ac';
              element.style.outlineOffset = '2px';
              setTimeout(() => {
                element.style.outline = originalOutline;
                element.style.outlineOffset = originalOutlineOffset;
              }, 3000);
              // Clear the hash
              history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          } catch (err) {
            console.error('Failed to scroll to marker element:', err);
          }
        }, 500);
      }
    }
  }

  checkHashForMarker();
  window.addEventListener('hashchange', checkHashForMarker);

  // Refresh markers periodically (every 30 seconds)
  setInterval(loadMarkers, 30000);

  // Update marker positions on scroll/resize
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(loadMarkers, 100);
  });

  window.addEventListener('resize', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(loadMarkers, 100);
  });

  } // end init()

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
