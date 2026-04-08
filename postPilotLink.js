// linking

(function() {
  var adList = [
    "https://spreadpreferencetelevision.com/wd2ty9hdks?key=3e4233c2961536215d9a80e154be33b9",
    "https://spreadpreferencetelevision.com/tba2ybi8y?key=e9181f1e0055b64f2438c9cf18ca8880",
    "https://spreadpreferencetelevision.com/varcnk2z?key=25e685626a3523b38c951f6afb1341e6",
    "https://spreadpreferencetelevision.com/x2fusvgn?key=2531ef9b0b688c0f6205ee45da3c50de",
  ];

  var SECRET_KEY = "XP_DekhoPrimeBlog2027";

  var WAIT_TIME = 20;

  var statusTexts = [
    "Syncing Node...",
    "Verifying View...",
    "Encrypting Connection...",
    "BDIX Routing Check...",
    "Finalizing Protocol..."
  ];

  function xorDecrypt(hex, key) {
    var result = "";
    for (var i = 0; i < hex.length; i += 2) {
      var code = parseInt(hex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length);
      result += String.fromCharCode(code);
    }
    return result;
  }

  function normalizeUrl(value) {
    var raw = (value || '').trim();
    if (!raw) return '';

    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\/\//.test(raw)) return 'https:' + raw;

    // Accept protocol-less domains like "example.com/path".
    if (/^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(raw)) {
      return 'https://' + raw;
    }

    return '';
  }

  function extractUrlLike(value) {
    var raw = (value || '').trim();
    if (!raw) return '';

    var m = raw.match(/https?:\/\/[^\s"'<>]+|\/\/[^\s"'<>]+|[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?\/[^\s"'<>]+/i);
    return m ? m[0] : '';
  }

  function extractHexPayload(value) {
    var raw = (value || '').trim();
    if (!raw) return '';

    var compact = raw.replace(/\s+/g, '');
    if (/^[0-9a-f]+$/i.test(compact) && compact.length >= 16 && compact.length % 2 === 0) {
      return compact;
    }

    var m = compact.match(/[0-9a-f]{16,}/ig);
    if (!m) return '';

    for (var i = 0; i < m.length; i++) {
      if (m[i].length % 2 === 0) return m[i];
    }

    return '';
  }

  function injectStyles() {
    if (document.getElementById('locker-styles')) return;
    var style = document.createElement('style');
    style.id = 'locker-styles';
    style.textContent = [
      '.locker-box{background:#fff;border-radius:10px;padding:20px;text-align:center;margin:15px auto;max-width:400px;width:100%;box-shadow:0 5px 20px rgba(0,0,0,0.08);border:1px solid #f0f3f5;font-family:sans-serif;box-sizing:border-box;}',
      '.locker-box h3{margin:0 0 8px;color:#2d3436;font-size:18px;font-weight:700;}',
      '.locker-box p{margin:0 0 20px;color:#636e72;font-size:13px;line-height:1.4;}',
      '.locker-progress-wrap{width:100%;height:8px;background:#f1f2f6;border-radius:10px;overflow:hidden;margin-bottom:15px;}',
      '.locker-progress-bar{width:0%;height:100%;background:#0984e3;transition:width 0.3s ease;}',
      '.locker-status-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;font-weight:bold;color:#2d3436;}',
      '.locker-btn{background:#0984e3;color:#fff;border:none;padding:12px 25px;border-radius:6px;font-weight:700;cursor:pointer;width:100%;font-size:14px;text-transform:uppercase;font-family:sans-serif;transition:0.2s;}',
      '.locker-btn:disabled{background:#b2bec3;cursor:not-allowed;}',
      '.locker-btn-success{background:#00b894;}',
      '.locker-warning{display:none;background:#fff9db;color:#e67e22;padding:8px;border-radius:6px;font-size:11px;font-weight:bold;border:1px solid #ffe066;margin-top:10px;}',
      '.locker-inline-msg{display:none;background:#fff4f4;color:#d63031;padding:8px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid #ffcccc;margin-top:10px;}',
      '.locker-placeholder{color:#636e72;font-size:13px;}',
    ].join('');
    document.head.appendChild(style);
  }

  function renderLocker(target, destinationURL) {
    target.style.display = 'block';
    target.innerHTML =
      '<div class="locker-box">' +

        // Step 1: Start
        '<div class="lk-start">' +
          '<div style="font-size:32px;margin-bottom:8px;">🔒</div>' +
          '<h3>Link Encrypted</h3>' +
          '<p>Unlock with Premium Ad Verification.</p>' +
          '<button class="locker-btn lk-btn-start">UNLOCK NOW</button>' +
          '<div class="locker-inline-msg lk-inline-msg"></div>' +
        '</div>' +

        // Step 2: Progress
        '<div class="lk-process" style="display:none;">' +
          '<div class="locker-status-row">' +
            '<span class="lk-status">Initializing...</span>' +
            '<span class="lk-percent">0%</span>' +
          '</div>' +
          '<div class="locker-progress-wrap">' +
            '<div class="locker-progress-bar"></div>' +
          '</div>' +
          '<div class="locker-warning lk-warning"></div>' +
        '</div>' +

        // Step 3: Done
        '<div class="lk-final" style="display:none;">' +
          '<div style="font-size:32px;margin-bottom:8px;">✅</div>' +
          '<h3 style="color:#00b894;">Verification Success</h3>' +
          '<button class="locker-btn locker-btn-success lk-btn-copy">COPY LINK</button>' +
        '</div>' +

      '</div>';


    var stepStart   = target.querySelector('.lk-start');
    var stepProcess = target.querySelector('.lk-process');
    var stepFinal   = target.querySelector('.lk-final');
    var progressBar = target.querySelector('.locker-progress-bar');
    var percentText = target.querySelector('.lk-percent');
    var statusMsg   = target.querySelector('.lk-status');
    var warningBox  = target.querySelector('.lk-warning');
    var inlineMsg   = target.querySelector('.lk-inline-msg');
    var btnStart    = target.querySelector('.lk-btn-start');
    var btnCopy     = target.querySelector('.lk-btn-copy');

    var adWindow = null;
    var timeLeft = WAIT_TIME;
    var timerInterval = null;
    var started = false;

    btnStart.addEventListener('click', function() {
      if (started) return;
      started = true;
      if (inlineMsg) {
        inlineMsg.style.display = 'none';
        inlineMsg.textContent = '';
      }

      var randomLink = adList[Math.floor(Math.random() * adList.length)];
      adWindow = window.open(randomLink, '_blank');

      if (!adWindow) {
        if (inlineMsg) {
          inlineMsg.style.display = 'block';
          inlineMsg.textContent = 'Popup blocked. Please allow popups and click unlock again.';
        }
        started = false;
        return;
      }

      stepStart.style.display = 'none';
      stepProcess.style.display = 'block';

 
      timerInterval = setInterval(function() {

        if (adWindow && adWindow.closed) {
          warningBox.style.display = 'block';
          warningBox.textContent = '⚠️ Ad Closed! Please reload and try again.';
          statusMsg.textContent = 'Process Aborted';
          clearInterval(timerInterval);
          return;
        }

        if (!document.hidden) {
          warningBox.style.display = 'block';
          warningBox.textContent = '⚠️ Stay on Ad Page to Continue!';
          statusMsg.textContent = 'Timer Paused';
          return;
        }

        // User on ad tab → count down
        warningBox.style.display = 'none';
        timeLeft--;

        var percent = Math.floor(((WAIT_TIME - timeLeft) / WAIT_TIME) * 100);
        progressBar.style.width = percent + '%';
        percentText.textContent = percent + '%';

        if (timeLeft % 4 === 0) {
          statusMsg.textContent = statusTexts[Math.floor(Math.random() * statusTexts.length)];
        }

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          stepProcess.style.display = 'none';
          stepFinal.style.display = 'block';
        }

      }, 1000);
    });

    // ── Copy button clicked ──
    btnCopy.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(destinationURL).then(function() {
          btnCopy.textContent = 'COPIED! ✅';
          setTimeout(function() { window.location.href = destinationURL; }, 1000);
        });
      } else {
        var tmp = document.createElement('input');
        tmp.value = destinationURL;
        tmp.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        btnCopy.textContent = 'COPIED! ✅';
        setTimeout(function() { window.location.href = destinationURL; }, 1000);
      }
    });
  }

  function getOrCreateRenderHost(node) {
    var existingHostId = node.getAttribute('data-locker-host-id');
    if (existingHostId) {
      var existingHost = document.getElementById(existingHostId);
      if (existingHost) return existingHost;
    }

    var host = document.createElement('div');
    var hostId = 'unlock-link-host-' + Math.random().toString(36).slice(2, 10);
    host.id = hostId;
    host.className = 'unlock-link-host';

    if (node.parentNode) {
      node.parentNode.insertBefore(host, node.nextSibling);
    }

    node.setAttribute('data-locker-host-id', hostId);
    return host;
  }

  // ── Scan for locker divs and init ──
function scanAndInit() {
  var list = Array.prototype.slice.call(
    document.querySelectorAll('#unlock-link, [id*="unlock-link"], .unlock-link, [data-unlock-link]')
  );

  list.forEach(function(node) {
    var host = getOrCreateRenderHost(node);
    if (host !== node) {
      node.style.display = 'none';
    }

    // Skip only if already fully rendered
    if (host.getAttribute('data-locker-init') === 'true') return;

    var encrypted = (
      node.getAttribute('data-encrypted') ||
      node.getAttribute('data-token') ||
      node.getAttribute('data-url') ||
      node.textContent ||
      ''
    ).trim();
    if (!encrypted) {
      // Show placeholder while waiting for payload injection without mutating marker content.
      if (!host.querySelector('.locker-box')) {
        host.style.display = 'block';
        host.innerHTML = '<div class="locker-box"><div class="locker-placeholder">Preparing secure link...</div></div>';
      }
      return;
    }

    var decrypted = '';
    try {
      var directUrl = normalizeUrl(encrypted) || normalizeUrl(extractUrlLike(encrypted));
      if (directUrl) {
        decrypted = directUrl;
      } else {
        var hexPayload = extractHexPayload(encrypted);
        if (hexPayload) {
          decrypted = normalizeUrl(xorDecrypt(hexPayload, SECRET_KEY));
        }
      }
    } catch(e) { decrypted = ''; }

    if (!decrypted) {
      host.style.display = 'block';
      host.innerHTML = '<div class="locker-box"><h3>Link Unavailable</h3><p>Unlock payload is missing or invalid. Please refresh the page.</p></div>';
      host.removeAttribute('data-locker-init');
      return;
    }

    try {
      renderLocker(host, decrypted);
      host.setAttribute('data-locker-init', 'true');
    } catch (e) {
      host.style.display = 'block';
      host.innerHTML = '<div class="locker-box"><h3>Link Unavailable</h3><p>Failed to render unlock layout. Please refresh the page.</p></div>';
      host.setAttribute('data-locker-init', 'true');
    }
  });
}

function init() {
  injectStyles();
  scanAndInit();
  
  new MutationObserver(function() {
    scanAndInit();
  }).observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true  // ← ADD THIS — catches text content changes
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
