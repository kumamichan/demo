/* =====================================================================
 * hair salon Lumi（架空）— 全デモアプリ共通のサンプルデータ
 * ---------------------------------------------------------------------
 * ・一人サロン（オーナー1名・セット面2席・開業3年目）
 * ・「今日」を基準に、直近6ヶ月の来店実績と今後45日の予約を毎回同じ形で作ります
 *   （乱数の種が固定なので、どのアプリで開いても数字が一致します）
 * ・window.LUMI に入ります
 * ===================================================================== */
(function () {
  "use strict";

  /* ---------- 日付の小道具 ---------- */
  const pad = n => String(n).padStart(2, "0");
  const toISO = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); };
  const monthStart = s => s.slice(0, 8) + "01";
  const addMonths = (s, n) => { const d = parse(monthStart(s)); d.setMonth(d.getMonth() + n); return toISO(d); };
  const monthEnd = s => { const d = parse(monthStart(s)); d.setMonth(d.getMonth() + 1); d.setDate(0); return toISO(d); };
  const dow = s => parse(s).getDay();
  const ym = s => s.slice(0, 7);

  const TODAY = toISO(new Date());

  /* ---------- 乱数（種を固定） ---------- */
  let seed = 20261118;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const between = (a, b) => a + rnd() * (b - a);
  const pickW = (items, wKey) => { const t = items.reduce((a, x) => a + x[wKey], 0); let r = rnd() * t; for (const x of items) { r -= x[wKey]; if (r < 0) return x; } return items[items.length - 1]; };

  /* ---------- サロン情報 ---------- */
  const salon = {
    name: "hair salon Lumi",
    kana: "ヘアサロン ルミ",
    owner: "中村 さき",
    role: "オーナースタイリスト",
    phone: "011-000-0000",
    address: "札幌市中央区○○ 1-2-3",
    area: "札幌",
    open: "10:00", close: "19:00",
    closedWeekdays: [2],              // 火曜定休
    seats: 2,
    concept: "ひとりで丁寧に。似合わせカットと、ダメージを抑えた艶カラーが得意なプライベートサロン"
  };
  const OPEN_MIN = 600, CLOSE_MIN = 1140;

  /* 不定休：第2水曜・第4月曜 */
  function isHoliday(ds) {
    const d = parse(ds), nth = Math.ceil(d.getDate() / 7);
    return (d.getDay() === 3 && nth === 2) || (d.getDay() === 1 && nth === 4);
  }
  function isBusinessDay(ds) { return salon.closedWeekdays.indexOf(dow(ds)) < 0 && !isHoliday(ds); }
  function businessDays(from, to) { let n = 0, d = from; while (d <= to) { if (isBusinessDay(d)) n++; d = addDays(d, 1); } return n; }
  function holidaysIn(from, to) { const out = []; let d = from; while (d <= to) { if (isHoliday(d)) out.push(d); d = addDays(d, 1); } return out; }

  /* ---------- 材料（在庫・原価で共通） ----------
     unit: 数える単位 / size: 1個あたりの内容量 / use: 内容量の単位 / cost: 1個の仕入れ値 */
  const suppliers = [
    { id: "dealerA", name: "ビューティー商事", note: "カラー剤・薬剤・業務用品" },
    { id: "dealerB", name: "ヘアケアサプライ", note: "トリートメント・店販品" }
  ];
  const materials = [
    { id: "col_br",  name: "カラー剤 ブラウン系 80g",   cat: "カラー剤",   unit: "本", size: 80,   use: "g",  cost: 980,  supplier: "dealerA", reorder: 6 },
    { id: "col_as",  name: "カラー剤 アッシュ系 80g",   cat: "カラー剤",   unit: "本", size: 80,   use: "g",  cost: 980,  supplier: "dealerA", reorder: 6 },
    { id: "col_gr",  name: "カラー剤 グレイカラー 80g", cat: "カラー剤",   unit: "本", size: 80,   use: "g",  cost: 1050, supplier: "dealerA", reorder: 5 },
    { id: "oxi",     name: "オキシ 6% 1000ml",          cat: "カラー剤",   unit: "本", size: 1000, use: "ml", cost: 780,  supplier: "dealerA", reorder: 2 },
    { id: "bleach",  name: "ブリーチ剤 500g",            cat: "カラー剤",   unit: "個", size: 500,  use: "g",  cost: 2800, supplier: "dealerA", reorder: 1 },
    { id: "perm",    name: "パーマ液 1剤2剤 400ml",      cat: "パーマ・縮毛", unit: "セット", size: 400, use: "ml", cost: 2400, supplier: "dealerA", reorder: 1 },
    { id: "str",     name: "縮毛矯正剤 400g",            cat: "パーマ・縮毛", unit: "個", size: 400,  use: "g",  cost: 3600, supplier: "dealerA", reorder: 1 },
    { id: "trsys",   name: "システムトリートメント 500ml", cat: "トリートメント", unit: "本", size: 500, use: "ml", cost: 5800, supplier: "dealerB", reorder: 1 },
    { id: "shampoo", name: "業務用シャンプー 1000ml",    cat: "シャンプー",  unit: "本", size: 1000, use: "ml", cost: 2200, supplier: "dealerB", reorder: 1 },
    { id: "rinse",   name: "業務用トリートメント 1000g", cat: "シャンプー",  unit: "本", size: 1000, use: "g",  cost: 2600, supplier: "dealerB", reorder: 1 },
    { id: "spa",     name: "スパ用クレンジング 500ml",   cat: "ヘッドスパ",  unit: "本", size: 500,  use: "ml", cost: 3000, supplier: "dealerB", reorder: 1 }
  ];

  /* ---------- 店販商品 ---------- */
  const products = [
    { id: "p_oil",   name: "ヘアオイル 100ml",       price: 3300, cost: 1820, supplier: "dealerB", reorder: 3, w: 5 },
    { id: "p_sh",    name: "シャンプー 300ml",        price: 3850, cost: 2120, supplier: "dealerB", reorder: 3, w: 3 },
    { id: "p_tr",    name: "トリートメント 250g",     price: 4180, cost: 2300, supplier: "dealerB", reorder: 3, w: 3 },
    { id: "p_csh",   name: "カラーシャンプー 300ml",  price: 3080, cost: 1700, supplier: "dealerB", reorder: 2, w: 2 },
    { id: "p_milk",  name: "ヘアミルク 120g",         price: 2970, cost: 1630, supplier: "dealerB", reorder: 2, w: 2 },
    { id: "p_balm",  name: "スタイリングバーム 40g",  price: 2200, cost: 1210, supplier: "dealerB", reorder: 2, w: 2 }
  ];

  /* ---------- メニュー（予約・KPI・原価で共通） ----------
     kpi: KPI管理で数える項目 / recipe: 1回あたりの材料の使用量（材料の use 単位） */
  const menus = [
    { id: "cut",      cat: "カット",        name: "カット",                 min: 60,  price: 5500,  kpi: [],          recipe: { shampoo: 25, rinse: 20 } },
    { id: "mens",     cat: "カット",        name: "メンズカット",           min: 45,  price: 4950,  kpi: [],          recipe: { shampoo: 20 } },
    { id: "cutcolor", cat: "カラー",        name: "カット＋カラー",         min: 120, price: 13200, kpi: ["color"],   recipe: { shampoo: 30, rinse: 25, col_br: 70, col_as: 30, oxi: 100 } },
    { id: "color",    cat: "カラー",        name: "リタッチカラー",         min: 75,  price: 7700,  kpi: ["color"],   recipe: { shampoo: 25, rinse: 20, col_gr: 60, col_br: 20, oxi: 80 } },
    { id: "bleach",   cat: "カラー",        name: "ブリーチ（追加）",       min: 60,  price: 6600,  kpi: ["bleach"],  recipe: { bleach: 60, oxi: 120 }, addon: true },
    { id: "wcolor",   cat: "カラー",        name: "ダブルカラー（追加）",   min: 90,  price: 11000, kpi: ["wcolor"],  recipe: { bleach: 60, oxi: 180, col_as: 60 }, addon: true },
    { id: "cutperm",  cat: "パーマ",        name: "カット＋パーマ",         min: 150, price: 14300, kpi: ["perm"],    recipe: { shampoo: 30, rinse: 25, perm: 120 } },
    { id: "straight", cat: "ストレート",    name: "カット＋髪質改善ストレート", min: 180, price: 17600, kpi: ["straight"], recipe: { shampoo: 30, rinse: 25, str: 90, trsys: 30 } },
    { id: "shuku",    cat: "縮毛矯正",      name: "カット＋縮毛矯正",       min: 210, price: 18700, kpi: ["shuku"],   recipe: { shampoo: 30, rinse: 25, str: 120 } },
    { id: "tr",       cat: "トリートメント", name: "トリートメント",         min: 30,  price: 3300,  kpi: ["tr"],      recipe: { trsys: 15 }, addon: true },
    { id: "trp",      cat: "トリートメント", name: "プレミアムトリートメント", min: 45, price: 5500,  kpi: ["tr"],      recipe: { trsys: 35 }, addon: true },
    { id: "spa",      cat: "ヘッドスパ",    name: "ヘッドスパ 30分",        min: 30,  price: 3300,  kpi: [],          recipe: { spa: 25, shampoo: 10 }, addon: true }
  ];
  const menuById = {}; menus.forEach(m => { menuById[m.id] = m; });
  const matById = {}; materials.forEach(m => { matById[m.id] = m; });
  const prodById = {}; products.forEach(p => { prodById[p.id] = p; });
  function materialCost(menuId) {
    const m = menuById[menuId]; let c = 0;
    Object.keys(m.recipe).forEach(k => { const mt = matById[k]; c += mt.cost / mt.size * m.recipe[k]; });
    return Math.round(c);
  }

  /* ---------- 固定費（月額） ---------- */
  const fixedCosts = [
    { name: "家賃", amount: 180000 },
    { name: "水道光熱費", amount: 22000 },
    { name: "予約サイト掲載料", amount: 33000 },
    { name: "通信費・システム利用料", amount: 9800 },
    { name: "設備リース（セット面・シャンプー台）", amount: 12000 },
    { name: "タオル・消耗品", amount: 10000 },
    { name: "広告・販促費（チラシ・SNS広告）", amount: 20000 },
    { name: "税理士・会計ソフト", amount: 15000 },
    { name: "保険・会費・その他", amount: 13200 }
  ];
  const cardFeeRate = 0.0325;   // キャッシュレス決済の手数料
  const cardShare = 0.7;        // キャッシュレス払いの割合

  /* ---------- お客様の名前 ---------- */
  const LAST = ["佐藤","鈴木","高橋","田中","伊藤","渡辺","山本","中村","小林","加藤","吉田","山田","佐々木","山口","松本","井上","木村","林","斎藤","清水","山崎","森","池田","橋本","阿部","石川","前田","藤田","小川","岡田","後藤","長谷川","村上","近藤","石井","坂本","遠藤","青木","藤井","西村"];
  const LAST_K = ["サトウ","スズキ","タカハシ","タナカ","イトウ","ワタナベ","ヤマモト","ナカムラ","コバヤシ","カトウ","ヨシダ","ヤマダ","ササキ","ヤマグチ","マツモト","イノウエ","キムラ","ハヤシ","サイトウ","シミズ","ヤマザキ","モリ","イケダ","ハシモト","アベ","イシカワ","マエダ","フジタ","オガワ","オカダ","ゴトウ","ハセガワ","ムラカミ","コンドウ","イシイ","サカモト","エンドウ","アオキ","フジイ","ニシムラ"];
  const FIRST_F = [["美咲","ミサキ"],["さくら","サクラ"],["陽菜","ヒナ"],["結衣","ユイ"],["葵","アオイ"],["真由","マユ"],["彩","アヤ"],["優子","ユウコ"],["恵","メグミ"],["麻衣","マイ"],["由美","ユミ"],["奈々","ナナ"],["千尋","チヒロ"],["沙織","サオリ"],["里奈","リナ"],["友美","トモミ"],["瞳","ヒトミ"],["香織","カオリ"],["舞","マイ"],["紗希","サキ"],["莉子","リコ"],["裕子","ユウコ"],["明美","アケミ"],["直美","ナオミ"]];
  const FIRST_M = [["健","ケン"],["大輔","ダイスケ"],["翔太","ショウタ"],["拓也","タクヤ"],["亮","リョウ"],["誠","マコト"],["悠斗","ユウト"],["和也","カズヤ"]];

  /* ---------- お客様のタイプ ----------
     cycle: 来店周期（日） / keep: 次も来てくれる確率 */
  const TYPES = [
    { id: "color",   w: 38, gender: "F", cycle: [42, 62],  keep: 0.90, base: [["cutcolor", 7], ["color", 3]],                 tr: 0.50, spa: 0.14, bleach: 0.06, wcolor: 0.04, buy: 0.24 },
    { id: "trend",   w: 10, gender: "F", cycle: [40, 60],  keep: 0.80, base: [["cutcolor", 1]],                              tr: 0.55, spa: 0.05, bleach: 0.45, wcolor: 0.35, buy: 0.20 },
    { id: "cut",     w: 18, gender: "F", cycle: [55, 85],  keep: 0.84, base: [["cut", 1]],                                   tr: 0.35, spa: 0.18, bleach: 0,    wcolor: 0,    buy: 0.15 },
    { id: "perm",    w: 7,  gender: "F", cycle: [60, 90],  keep: 0.85, base: [["cutperm", 3], ["cut", 1]],                   tr: 0.45, spa: 0.05, bleach: 0,    wcolor: 0,    buy: 0.18 },
    { id: "straight",w: 11, gender: "F", cycle: [90, 130], keep: 0.88, base: [["shuku", 3], ["straight", 2], ["cut", 2]],     tr: 0.35, spa: 0.05, bleach: 0,    wcolor: 0,    buy: 0.26 },
    { id: "men",     w: 14, gender: "M", cycle: [30, 45],  keep: 0.86, base: [["mens", 1]],                                  tr: 0.05, spa: 0.20, bleach: 0,    wcolor: 0,    buy: 0.08 }
  ];

  const customers = [];
  let custSeq = 0;
  function newCustomer(firstVisitApprox) {
    const t = pickW(TYPES, "w");
    const li = Math.floor(rnd() * LAST.length);
    const fl = t.gender === "M" ? FIRST_M : FIRST_F;
    const fi = Math.floor(rnd() * fl.length);
    custSeq++;
    const c = {
      id: "c" + String(custSeq).padStart(4, "0"),
      name: LAST[li] + " " + fl[fi][0],
      kana: LAST_K[li] + " " + fl[fi][1],
      gender: t.gender,
      phone: "090" + String(10000000 + Math.floor(rnd() * 89999999)),
      type: t.id,
      cycle: Math.round(between(t.cycle[0], t.cycle[1])),
      keep: Math.min(0.97, t.keep + (rnd() - 0.5) * 0.1),
      prefStart: [600, 660, 720, 780, 840, 900, 960][Math.floor(rnd() * 7)],
      visits: 0, pre: 0, preLast: "", preMenu: "", firstVisit: "", lastVisit: "", lastMenu: "", lost: false, nextDue: firstVisitApprox, memo: ""
    };
    customers.push(c);
    return c;
  }

  /* ---------- 来店をつくる ---------- */
  const SIM_START = addMonths(TODAY, -6);
  const SIM_END = addDays(TODAY, 45);
  const visits = [];     // 来店実績（今日より前）
  const bookings = [];   // 今日以降の予約（すでに予約が入っているもの）
  let visitSeq = 0;

  // 開始前からのお客様（半年より前に来店歴あり）
  for (let i = 0; i < 158; i++) {
    const c = newCustomer(addDays(SIM_START, Math.floor(rnd() * 70)));
    c.visits = 1 + Math.floor(rnd() * 8);
    c.pre = c.visits;
    c.firstVisit = addDays(SIM_START, -Math.floor(between(60, 900)));
    c.lastVisit = addDays(c.nextDue, -c.cycle);
    c.preLast = c.lastVisit;
    c.preMenu = menuById[TYPES.find(x => x.id === c.type).base[0][0]].name;
  }

  function buildMenus(c) {
    const t = TYPES.find(x => x.id === c.type);
    const base = pickW(t.base.map(([id, w]) => ({ id, w })), "w").id;
    const out = [base];
    const isColor = base === "cutcolor" || base === "color";
    if (isColor && rnd() < t.wcolor) out.push("wcolor");
    else if (isColor && rnd() < t.bleach) out.push("bleach");
    if (base !== "straight" && rnd() < t.tr) out.push(rnd() < 0.35 ? "trp" : "tr");
    if (rnd() < t.spa) out.push("spa");
    return out;
  }

  let d = SIM_START;
  const queue = [];
  while (d <= SIM_END) {
    if (!isBusinessDay(d)) { d = addDays(d, 1); continue; }
    const daysAhead = Math.round((parse(d) - parse(TODAY)) / 86400000);
    // その日に来たいお客様
    const due = customers.filter(c => !c.lost && c.nextDue <= d);
    due.sort((a, b) => a.nextDue < b.nextDue ? -1 : 1);
    // 新規のお客様（1日あたり平均0.65人、週末は多め）
    const wd = dow(d);
    let newN = 0; const lam = (wd === 0 || wd === 6) ? 0.95 : 0.55;
    let p = Math.exp(-lam), k = 0, s = p; const u = rnd(); while (u > s) { k++; p *= lam / k; s += p; } newN = k;
    const newbies = []; for (let i = 0; i < newN; i++) newbies.push(newCustomer(d));
    const want = newbies.concat(due);

    // 予約枠に詰める（15分単位、ひとりなので重ならないように）
    const busy = [];
    const fits = (s0, dur) => s0 >= OPEN_MIN && s0 + dur <= CLOSE_MIN && busy.every(b => s0 + dur <= b.s || s0 >= b.s + b.d);
    const dayVisits = [];
    for (const c of want) {
      if (dayVisits.length >= 7) { c.nextDue = addDays(d, 1); continue; }
      const ms = buildMenus(c);
      const dur = ms.reduce((a, id) => a + menuById[id].min, 0);
      const pref = c.prefStart + (rnd() < 0.5 ? 0 : 60);
      const cand = [];
      for (let t = OPEN_MIN; t + dur <= CLOSE_MIN; t += 15) cand.push(t);
      cand.sort((a, b) => Math.abs(a - pref) - Math.abs(b - pref));
      const st = cand.find(t => fits(t, dur));
      if (st == null) { c.nextDue = addDays(d, 1 + Math.floor(rnd() * 2)); continue; }
      busy.push({ s: st, d: dur });
      const isNew = c.visits === 0;
      const price = ms.reduce((a, id) => a + menuById[id].price, 0);
      const t = TYPES.find(x => x.id === c.type);
      const items = [];
      if (rnd() < t.buy + (isNew ? 0.04 : 0)) {
        const pr = pickW(products, "w"); const q = rnd() < 0.18 ? 2 : 1;
        items.push({ id: pr.id, name: pr.name, qty: q, amount: q * pr.price });
      }
      visitSeq++;
      const v = {
        id: "v" + String(visitSeq).padStart(5, "0"), date: d, start: st, dur: dur,
        customerId: c.id, menus: ms, price: price, items: items,
        prodSales: items.reduce((a, x) => a + x.amount, 0),
        isNew: isNew, source: isNew ? (rnd() < 0.7 ? "web" : "store") : (rnd() < 0.55 ? "web" : "store")
      };
      dayVisits.push(v);
      // お客様の状態を進める
      c.visits++; if (!c.firstVisit) c.firstVisit = d;
      c.lastVisit = d; c.lastMenu = ms.map(id => menuById[id].name).join("＋");
      const keep = isNew ? 0.62 : c.keep;
      if (rnd() > keep) c.lost = true;
      c.nextDue = addDays(d, Math.round(c.cycle * between(0.85, 1.25)));
      v.bookedAhead = rnd() < (c.visits > 2 ? 0.45 : 0.2); // 次回予約を当日にとったか（未来予約の判定に使用）
    }
    dayVisits.sort((a, b) => a.start - b.start);
    for (const v of dayVisits) {
      if (d < TODAY) visits.push(v);
      else {
        // 未来の来店は「すでに予約済み」のものだけを予約として残す
        const lead = daysAhead;
        const pBooked = lead <= 0 ? 1 : lead <= 3 ? 0.92 : lead <= 7 ? 0.78 : lead <= 14 ? 0.58 : lead <= 30 ? 0.36 : 0.18;
        if (rnd() < pBooked) bookings.push(Object.assign({}, v, { status: "confirmed" }));
      }
    }
    d = addDays(d, 1);
  }

  // 未来のシミュレーションで動いたお客様情報を、今日時点に戻す
  const pastByCust = {};
  visits.forEach(v => { (pastByCust[v.customerId] = pastByCust[v.customerId] || []).push(v); });
  customers.forEach(c => {
    const pv = pastByCust[c.id] || [];
    c.visits = c.pre + pv.length;
    if (pv.length) {
      const last = pv[pv.length - 1];
      c.lastVisit = last.date; c.lastMenu = last.menus.map(id => menuById[id].name).join("＋");
      if (!c.pre) c.firstVisit = pv[0].date;
    } else { c.lastVisit = c.preLast; c.lastMenu = c.preMenu; c.firstVisit = c.pre ? c.firstVisit : ""; }
    // 今日時点の状態（来店周期の何倍あいているか）
    const gap = c.lastVisit ? Math.round((parse(TODAY) - parse(c.lastVisit)) / 86400000) : 0;
    c.daysSince = gap;
    c.status = !c.visits ? "予約のみ" : gap <= c.cycle * 1.2 ? "通常" : gap <= c.cycle * 2 ? "離脱注意" : "失客";
    delete c.lost; delete c.nextDue;
  });
  // まだ存在しないお客様（未来のシミュレーションだけで生まれ、予約もない人）を外す
  const bookedIds = {}; bookings.forEach(b => { bookedIds[b.customerId] = 1; });
  for (let i = customers.length - 1; i >= 0; i--) { const c = customers[i]; if (!c.visits && !bookedIds[c.id]) customers.splice(i, 1); }

  /* ---------- 日別の集計（KPI用） ---------- */
  function dayStats(list) {
    const out = {};
    list.forEach(v => {
      const r = out[v.date] || (out[v.date] = { date: v.date, sales: 0, cust: 0, newc: 0, color: 0, bleach: 0, wcolor: 0, perm: 0, tr: 0, straight: 0, shuku: 0, spa: 0, prodSales: 0, prodQty: 0, items: [] });
      r.sales += v.price + v.prodSales; r.cust++; if (v.isNew) r.newc++;
      const tags = {}; v.menus.forEach(id => menuById[id].kpi.forEach(k => { tags[k] = 1; }));
      if (tags.bleach || tags.wcolor) tags.color = 1;
      Object.keys(tags).forEach(k => { r[k]++; });
      if (v.menus.indexOf("spa") >= 0) r.spa++;
      v.items.forEach(it => {
        r.prodSales += it.amount; r.prodQty += it.qty;
        const ex = r.items.find(x => x.name === it.name);
        if (ex) { ex.qty += it.qty; ex.amount += it.amount; } else r.items.push({ name: it.name, qty: it.qty, amount: it.amount });
      });
    });
    return Object.keys(out).sort().map(k => out[k]);
  }

  /* ---------- 月の目標 ---------- */
  function targetFor(month) {
    const days = businessDays(month + "-01", monthEnd(month + "-01"));
    return { sales: 1200000, cust: 98, unit: Math.round(1200000 / 98), days: days, newc: 15, colorRate: 55, trRate: 45 };
  }

  /* ---------- 材料の使用量 ---------- */
  function usageOf(list) {
    const u = {}; materials.forEach(m => { u[m.id] = 0; });
    list.forEach(v => v.menus.forEach(id => { const r = menuById[id].recipe; Object.keys(r).forEach(k => { u[k] += r[k]; }); }));
    return u; // 材料の use 単位（g・ml）
  }

  /* ---------- 在庫と発注履歴 ----------
     月初に「先月の使用量＋少し」を発注した、という形で履歴を作り、今の在庫を計算します */
  const stock = {};      // 材料・店販の現在庫（個数）
  const orders = [];     // 発注履歴
  (function buildStock() {
    const months = []; let m = monthStart(SIM_START); while (m <= TODAY) { months.push(m); m = addMonths(m, 1); }
    const level = {};
    materials.forEach(x => { level[x.id] = x.reorder * x.size * 2; });
    products.forEach(x => { level[x.id] = x.reorder * 2 + 2; });
    let oseq = 0;
    months.forEach((ms, i) => {
      const me = monthEnd(ms) < TODAY ? monthEnd(ms) : addDays(TODAY, -1);
      const mv = visits.filter(v => v.date >= ms && v.date <= me);
      // 月初の発注（前月の使用量を目安に、発注点を割りそうなものを補充）
      const prev = visits.filter(v => v.date >= addMonths(ms, -1) && v.date < ms);
      const pu = usageOf(prev.length ? prev : mv);
      const lines = [];
      materials.forEach(x => {
        const need = pu[x.id] * 1.1 + x.reorder * x.size - level[x.id];
        const qty = Math.max(0, Math.ceil(need / x.size));
        if (qty > 0) { lines.push({ id: x.id, name: x.name, kind: "材料", qty, unit: x.unit, price: x.cost, supplier: x.supplier }); level[x.id] += qty * x.size; }
      });
      const psold = {}; products.forEach(p => { psold[p.id] = 0; });
      (prev.length ? prev : mv).forEach(v => v.items.forEach(it => { psold[it.id] += it.qty; }));
      products.forEach(x => {
        const need = psold[x.id] + x.reorder - level[x.id];
        const qty = Math.max(0, Math.ceil(need));
        if (qty > 0) { lines.push({ id: x.id, name: x.name, kind: "店販", qty, unit: "個", price: x.cost, supplier: x.supplier }); level[x.id] += qty; }
      });
      if (lines.length) {
        const odate = (() => { let dd = ms; while (!isBusinessDay(dd)) dd = addDays(dd, 1); return dd; })();
        suppliers.forEach(sp => {
          const ls = lines.filter(l => l.supplier === sp.id);
          if (ls.length) { oseq++; orders.push({ id: "o" + oseq, date: odate, supplier: sp.id, lines: ls, total: ls.reduce((a, l) => a + l.qty * l.price, 0), status: "納品済み" }); }
        });
      }
      // 使った分を減らす
      const u = usageOf(mv);
      materials.forEach(x => { level[x.id] = Math.max(0, level[x.id] - u[x.id]); });
      mv.forEach(v => v.items.forEach(it => { level[it.id] = Math.max(0, level[it.id] - it.qty); }));
    });
    materials.forEach(x => { stock[x.id] = Math.max(0, Math.floor(level[x.id] / x.size * 10) / 10); });
    products.forEach(x => { stock[x.id] = Math.max(0, Math.round(level[x.id])); });
    // デモで「発注が必要」が見えるように、いくつかを少なめにしておく
    stock.col_as = Math.min(stock.col_as, 3); stock.oxi = Math.min(stock.oxi, 1); stock.p_oil = Math.min(stock.p_oil, 1);
  })();

  /* ---------- 公開 ---------- */
  window.LUMI = {
    TODAY, salon, OPEN_MIN, CLOSE_MIN,
    menus, menuById, materials, matById, products, prodById, suppliers,
    fixedCosts, cardFeeRate, cardShare,
    customers, visits, bookings, orders, stock,
    materialCost, usageOf, dayStats, targetFor,
    isBusinessDay, isHoliday, businessDays, holidaysIn,
    util: { pad, toISO, parse, addDays, monthStart, addMonths, monthEnd, dow, ym }
  };
})();
