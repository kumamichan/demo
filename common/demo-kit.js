/* =====================================================================
 * デモ共通部品：上部バー（デモ一覧へ戻る・使い方・最初に戻す）と説明モード
 * 使い方：アプリ側で window.DEMO = { app, pain, steps:[{t,d}], reset } を
 *        定義してから、このファイルを読み込みます。
 * ===================================================================== */
(function () {
  "use strict";
  const cfg = window.DEMO || {};
  const css = `
  #dk-bar{position:relative;z-index:30;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#1f2a2e;color:#f4f1ea;font:500 12px/1.4 "Hiragino Sans","Noto Sans JP","Yu Gothic UI",sans-serif;-webkit-font-smoothing:antialiased}
  #dk-bar a,#dk-bar button{color:inherit;text-decoration:none;background:rgba(255,255,255,.1);border:0;border-radius:999px;padding:5px 10px;font:inherit;cursor:pointer;white-space:nowrap}
  #dk-bar a:hover,#dk-bar button:hover{background:rgba(255,255,255,.2)}
  #dk-bar .dk-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;opacity:.9}
  #dk-bar .dk-t b{font-weight:700}
  #dk-bar .dk-help{background:#e9b949;color:#1f2a2e;font-weight:700}
  #dk-bar .dk-help:hover{background:#f1c75f}
  #dk-guide{position:fixed;inset:0;z-index:2147483000;background:rgba(15,20,22,.55);display:none;align-items:flex-end;justify-content:center;padding:12px;font:15px/1.7 "Hiragino Sans","Noto Sans JP","Yu Gothic UI",sans-serif;color:#1f2a2e}
  #dk-guide.on{display:flex}
  @media(min-width:640px){#dk-guide{align-items:center}}
  #dk-guide .dk-box{background:#fffdf8;border-radius:18px;max-width:540px;width:100%;max-height:86vh;overflow:auto;padding:20px 20px 16px;box-shadow:0 10px 40px rgba(0,0,0,.25)}
  #dk-guide h2{font-size:17px;margin:0 0 4px}
  #dk-guide .dk-sub{font-size:12px;color:#6b6a63;margin:0 0 12px}
  #dk-guide .dk-pain{background:#f6efdc;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:14px}
  #dk-guide .dk-pain b{display:block;font-size:12px;color:#8a6a1c;margin-bottom:2px}
  #dk-guide ol{margin:0;padding:0;list-style:none;counter-reset:s}
  #dk-guide li{counter-increment:s;position:relative;padding:0 0 12px 38px;font-size:14px}
  #dk-guide li::before{content:counter(s);position:absolute;left:0;top:0;width:26px;height:26px;border-radius:50%;background:#1f2a2e;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
  #dk-guide li b{display:block;font-size:14.5px}
  #dk-guide li span{color:#55544e;font-size:13px}
  #dk-guide .dk-close{display:block;width:100%;margin-top:6px;border:0;border-radius:12px;padding:12px;background:#1f2a2e;color:#fff;font:inherit;font-weight:700;cursor:pointer}
  #dk-guide .dk-note{font-size:11.5px;color:#8a8984;margin:10px 0 0;text-align:center}
  `;
  function init() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const bar = document.createElement("div"); bar.id = "dk-bar";
    bar.innerHTML = `<a href="${cfg.home || "../index.html"}" aria-label="デモ一覧に戻る">‹ 一覧</a>
      <span class="dk-t"><b>${cfg.app || "デモ"}</b>｜hair salon Lumi（架空）</span>
      <button type="button" class="dk-help" id="dk-open">💡 使い方</button>
      <button type="button" id="dk-reset" aria-label="デモを最初の状態に戻す">↺ 戻す</button>`;
    document.body.insertBefore(bar, document.body.firstChild);

    const g = document.createElement("div"); g.id = "dk-guide"; g.setAttribute("role", "dialog"); g.setAttribute("aria-modal", "true");
    const steps = (cfg.steps || []).map(s => `<li><b>${s.t}</b><span>${s.d || ""}</span></li>`).join("");
    g.innerHTML = `<div class="dk-box">
      <h2>${cfg.app || ""} の見せ方</h2>
      <p class="dk-sub">代理店さま向け：この順番で触ると約3分で説明できます</p>
      ${cfg.pain ? `<div class="dk-pain"><b>このアプリで解決できるお悩み</b>${cfg.pain}</div>` : ""}
      <ol>${steps}</ol>
      <button type="button" class="dk-close" id="dk-close">デモを触ってみる</button>
      <p class="dk-note">デモの数字はすべて架空のサロン「hair salon Lumi」のものです。入力した内容は「↺ 戻す」で元に戻せます。</p>
    </div>`;
    document.body.appendChild(g);
    const open = () => g.classList.add("on"), close = () => { const was = g.classList.contains("on"); g.classList.remove("on"); if (was && typeof cfg.onClose === "function") cfg.onClose(); };
    document.getElementById("dk-open").onclick = open;
    document.getElementById("dk-close").onclick = close;
    g.addEventListener("click", e => { if (e.target === g) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    document.getElementById("dk-reset").onclick = () => {
      if (typeof cfg.reset === "function") cfg.reset();
      location.reload();
    };
    // 初めて開いたときだけ自動で表示
    let seen = false;
    try { seen = sessionStorage.getItem("dk-seen-" + (cfg.id || cfg.app)) === "1"; sessionStorage.setItem("dk-seen-" + (cfg.id || cfg.app), "1"); } catch (e) { seen = true; }
    if (!seen && cfg.steps && cfg.autoOpen !== false) setTimeout(open, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
