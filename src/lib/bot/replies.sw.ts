import type { Translation } from "./replies.i18n";

/** Swahili layer over the English reply book (see replies.i18n.ts). */
export const SW: Translation = {
  greeting: {
    match: [
      "habari",
      "hujambo",
      "mambo",
      "shikamoo",
      "habari za asubuhi",
      "habari za mchana",
      "habari za jioni",
      "niaje",
      "habari yako",
    ],
    replies: [
      "Habari rafiki, ni Sarah hapa! Nafurahi sana kusikia kutoka kwa mtu mpya, nikusaidie nini leo?",
      "Hey wewe! Asante kwa kunitumia ujumbe, unafikiria nini leo?",
    ],
    buttons: [["🛍 Bidhaa (Bure & Kununua)"], ["❓ Nina Swali Lingine"]],
  },
  products: {
    match: [
      "bei",
      "bei gani",
      "gharama",
      "bidhaa",
      "kiashiria",
      "viashiria",
      "nunua",
      "kifurushi",
      "vifurushi",
      "ni ngapi",
    ],
    replies: [
      "Tuna vitu kadhaa vinavyoweza kukufaa. Angalia hapa uniambie kipi kinakuvutia ✨",
      "Inategemea unachotafuta, rafiki. Hivi ndivyo tunavyotoa, chagua hapa chini.",
    ],
    buttons: [["🎯 Vifurushi vya Signals"], ["📈 TradingView", "🖥 Zana za MT5"]],
  },
  tv_products: {
    match: [
      "kiashiria cha tradingview",
      "viashiria vya tradingview",
      "bidhaa za tradingview",
      "tradingview bidhaa",
      "ezymap tradingview",
      "kiashiria tradingview",
    ],
    replies: ["Hivi ndivyo tulivyo navyo kwa TradingView. Chagua toleo ili uone bei."],
    buttons: [["EzyMap Lite", "EzyMap Pro"], ["⬅ Rudi"]],
  },
  tv_lite: {
    match: [
      "toleo la lite",
      "ezymap lite bei",
      "lite ya tradingview",
      "toleo lite",
      "bei ya lite",
      "lite ya ezymap",
    ],
    replies: [
      "TradingView EzyMap Lite inakupa zana za kuchora na kuweka ramani (mapping) kwenye TradingView, bila live signals, njia ya bei nafuu zaidi ya kuanza. Lipa mara moja tu, utumie maisha yote.",
    ],
    buttons: [["Maisha Yote – $49"], ["⬅ Rudi"]],
  },
  tv_pro: {
    match: [
      "toleo la pro",
      "ezymap pro bei",
      "pro ya tradingview",
      "toleo pro",
      "bei ya pro",
      "pro ya ezymap",
      "kiashiria kamili",
    ],
    replies: [
      "TradingView EzyMap Pro inakupa indicator kamili chenye live signals kuanzia M1 hadi H4, inafaa sana kama tayari unafanya trading kwenye TradingView. Lipa mara moja tu, utumie maisha yote.",
    ],
    buttons: [["Maisha Yote – $249"], ["⬅ Rudi"]],
  },
  mt5_products: {
    match: [
      "zana za mt5",
      "viashiria vya mt5",
      "kiashiria cha mt5",
      "bidhaa za mt5",
      "mt5 zana",
      "mt5 viashiria",
      "bundle ya mt5",
      "kifurushi cha mt5",
    ],
    replies: [
      "Hivi ndivyo vyote tulivyo navyo kwa MT5. Bundle kamili inajumuisha indicators vyote 17, au chagua kimoja tu unachohitaji.",
    ],
    buttons: [
      ["MT5 Bundle Kamili (thamani $999)"],
      ["Bulk Close", "Drawdown Guardian"],
      ["Auto TPSL", "Currency Strength"],
      ["MTF Bias"],
      ["⬅ Rudi"],
    ],
  },
  mt5_bundle: {
    match: [
      "bundle kamili",
      "bundle nzima",
      "viashiria vyote",
      "kifurushi kamili",
      "seti kamili ya viashiria",
      "bundle ya viashiria",
      "viashiria vyote vya mt5",
    ],
    replies: [
      "Bundle kamili inakupa indicators vyote 17 vya MT5 EzyMap kwa mara moja, thamani bora zaidi kama unataka kila kitu.",
    ],
    buttons: [
      ["Mwezi 1 – $99"],
      ["Miezi 6 – $499"],
      ["Mwaka 1 – $999"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  mt5_bulk_close: {
    match: [
      "funga kwa wingi",
      "kufunga layers",
      "funga layers zote",
      "kufunga oda nyingi",
      "faida ya sehemu",
      "bulk close mt5",
      "funga oda zote",
    ],
    replies: [
      "Bulk Close inakuwezesha kufunga faida ya sehemu (partial profit) kwenye idadi yoyote ya layers, kwa haraka. Bidhaa yetu inayouzwa zaidi, kwa sababu nzuri.",
    ],
    buttons: [
      ["Mwezi 1 – $19"],
      ["Miezi 6 – $109"],
      ["Mwaka 1 – $199"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  mt5_drawdown_guardian: {
    match: [
      "mlinzi wa drawdown",
      "drawdown yangu",
      "kudhibiti drawdown",
      "changamoto ya prop firm",
      "prop firm challenge",
      "kupunguza hasara",
      "ulinzi wa drawdown",
    ],
    replies: [
      "Drawdown Guardian inakuweka macho kuhusu drawdown yako ya sasa ili usiondolewe kwenye prop firm challenge. Kipenzi cha traders wetu wa prop firm.",
    ],
    buttons: [
      ["Mwezi 1 – $9"],
      ["Miezi 6 – $49"],
      ["Mwaka 1 – $99"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  mt5_auto_tpsl: {
    match: [
      "tp na sl",
      "weka tp na sl",
      "tp sl otomatiki",
      "take profit na stop loss",
      "stop loss otomatiki",
      "kuweka stop loss",
      "tpsl otomatiki",
    ],
    replies: [
      "Auto TPSL inakuepushia kazi ya kuweka TP & SL kwa mkono kwa kila layer. Jambo moja pungufu la kuhangaika nalo.",
    ],
    buttons: [
      ["Mwezi 1 – $9"],
      ["Miezi 6 – $49"],
      ["Mwaka 1 – $99"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  mt5_currency_strength: {
    match: [
      "nguvu ya sarafu",
      "nguvu za sarafu",
      "kipimo cha nguvu",
      "sarafu yenye nguvu",
      "mabadiliko ya soko",
      "currency strength mt5",
      "kipimo cha sarafu",
    ],
    replies: [
      "Currency Strength Meter inakupa taarifa za volatility ya sasa ya sarafu zinazofanyiwa trading zaidi, kwa mtazamo mmoja tu.",
    ],
    buttons: [
      ["Mwezi 1 – $9"],
      ["Miezi 6 – $49"],
      ["Mwaka 1 – $99"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  mt5_mtf_bias: {
    match: [
      "mwelekeo wa soko",
      "timeframe nyingi",
      "mwelekeo wa timeframe",
      "bias ya soko",
      "mwelekeo wa muda mwingi",
      "mtf bias mt5",
      "bullish au bearish",
    ],
    replies: [
      "MTF Bias inaonyesha mwelekeo wa bullish au bearish ili kukupa confluence kwa mpango wako wa trading kadri unavyobadilika.",
    ],
    buttons: [
      ["Mwezi 1 – $9"],
      ["Miezi 6 – $49"],
      ["Mwaka 1 – $99"],
      ["🎁 Jaribu Siku 3"],
      ["⬅ Rudi"],
    ],
  },
  broker: {
    match: [
      "broker gani",
      "fungua akaunti",
      "akaunti ya vantage",
      "jisajili vantage",
      "signals za bure",
      "bonasi",
      "bonasi ya deposit",
      "pakua app ya vantage",
      "matangazo",
      "ebook ya bure",
    ],
    replies: [
      "Tunashirikiana na Vantage Markets kwa trading, Jack amewatumia kwa miaka mingi kwa sababu ya withdrawals za haraka na executions za haraka. Kufungua akaunti chini ya IB yake kunafungua pia faida za bure: ebooks, signals, indicators, kulingana na tier yako, bila malipo ya ziada.",
    ],
    buttons: [
      ["🎁 Angalia Vifurushi"],
      ["📝 Jisajili kupitia Telegram Bot"],
      ["🎁 Matangazo & Zawadi"],
      ["📲 Pakua App ya Vantage"],
    ],
  },
  faq: {
    match: [
      "maswali",
      "swali",
      "swali lingine",
      "nina swali",
      "maswali ya kawaida",
      "nataka kuuliza",
      "naomba kuuliza",
      "nisaidie kuelewa",
    ],
    replies: ["Una maswali? Chagua moja hapa chini nami nitakujibu papa hapa ✨"],
    buttons: [
      ["Je, ni bure kujiunga?"],
      ["Vifurushi vya bure vs Kununua?"],
      ["Deposit kiasi gani?"],
      ["Elite ina nini?"],
      ["Tayari una akaunti ya Vantage?"],
      ["Inachukua muda gani kufunguliwa?"],
      ["Nalipa vipi?"],
      ["Refund au kughairi?"],
      ["Nahitaji TradingView?"],
      ["Umekwama wakati wa kujisajili/kulipa?"],
      ["App ya Vantage haipakuliwi (Android)"],
    ],
  },
  faq_free: {
    match: [
      "ni bure kujiunga",
      "je ni bure",
      "kweli ni bure",
      "kujiunga ni bure",
      "bure kabisa",
      "inalipiwa",
    ],
    replies: [
      "Ndiyo! Tier ya Free na Vantage Trial ya siku 30 hazigharimu chochote — trial inahitaji tu akaunti chini ya IB ya Jack kwenye Vantage Markets. Vifurushi vya kulipia (Pro $49, Premium $99, Elite $299) na indicators vya EzyMap ndivyo pekee unavyolipia.",
    ],
    buttons: [["🎁 Angalia Vifurushi"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_difference: {
    match: [
      "tofauti ya bure na kununua",
      "tofauti ya vifurushi",
      "tofauti kati ya vifurushi",
      "vifurushi vinatofautiana vipi",
      "tofauti gani",
      "bure na kulipia",
    ],
    replies: [
      "Tier ya Free na Vantage Trial hufunguliwa kutokana na hali ya akaunti yako ya broker chini ya IB ya Jack. Pro, Premium na Elite ni uanachama wa kulipia wenye routines kamili na mtiririko wa signals. indicators vya EzyMap (TradingView / MT5) ni bidhaa tofauti za kulipia mara moja.",
    ],
    buttons: [["⬅ Rudi kwa Maswali"]],
  },
  faq_deposit: {
    match: [
      "deposit kiasi gani",
      "deposit ya chini",
      "kiasi cha chini cha deposit",
      "niweke pesa ngapi",
      "deposit ngapi",
      "amana ya chini",
    ],
    replies: [
      "Kwa Vantage Trial unahitaji tu akaunti live iliyofunguliwa chini ya IB ya Jack — deposit ya kiasi chochote inaianzisha. Vifurushi vya kulipia havihitaji deposit ya broker kabisa.",
    ],
    buttons: [["🎁 Angalia Vifurushi"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_elite: {
    match: [
      "elite ina nini",
      "napata nini kwenye elite",
      "faida za elite",
      "kifurushi cha elite",
      "elite inajumuisha nini",
      "pakiti ya elite",
    ],
    replies: [
      "Kila kitu kilicho kwenye Premium, pamoja na seti kamili ya indicators vya EzyMap MT5 (Drawdown Guardian, Bulk Close yenye Layer Close, Auto TPSL, na zaidi), na Ezy Elite Circle yenye msaada wa 1-on-1 kutoka kwa Jack.",
    ],
    buttons: [["🎁 Angalia Vifurushi"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_existing_account: {
    match: [
      "tayari nina akaunti ya vantage",
      "tayari nina akaunti",
      "nina akaunti ya vantage",
      "nimeshafungua akaunti",
      "badilisha ib",
      "kubadilisha ib",
      "akaunti ya zamani",
    ],
    replies: [
      "Ndiyo! Tumia Change IB badala ya kufungua akaunti mpya (inafanywa kwa email, si kwa link), kisha tuma maelezo yako kwa njia ile ile.",
    ],
    buttons: [["🎁 Angalia Vifurushi"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_unlock_time: {
    match: [
      "inachukua muda gani kufunguliwa",
      "kifurushi kitafunguliwa lini",
      "muda gani kufungua",
      "lini kitafunguliwa",
      "bado haijafunguliwa",
      "kufunguliwa lini",
      "muda wa kufungua",
    ],
    replies: [
      "Vifurushi vya kulipia hufunguliwa moja kwa moja mara tu malipo yanapokamilika — angalia kwa /status. Vantage Trial hufunguliwa mara tu unapothibitisha kuwa akaunti yako imefunguliwa chini ya IB ya Jack.",
    ],
    buttons: [["⬅ Rudi kwa Maswali"]],
  },
  faq_how_to_pay: {
    match: [
      "nalipa vipi",
      "jinsi ya kulipa",
      "njia ya kulipa",
      "njia za malipo",
      "nilipe vipi",
      "kulipia kiashiria",
      "namna ya kulipa",
      "malipo",
    ],
    replies: [
      "Vifurushi hulipiwa kwa kadi kupitia link salama ya checkout ambayo bot itakutumia — ufikiaji hufunguliwa wenyewe mara malipo yanapokamilika. Kwa indicators vya EzyMap, niambie unataka kipi na Sarah atakutumia maelezo ya malipo hapa hapa.",
    ],
    buttons: [["🎯 Angalia Vifurushi"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_refund: {
    match: [
      "kurudishiwa pesa",
      "nirudishiwe pesa",
      "kughairi ununuzi",
      "naweza kurudishiwa",
      "ghairi ununuzi",
      "rudisha pesa",
      "refund ya pesa",
    ],
    replies: [
      "Mtumie Sarah ujumbe moja kwa moja ili mjadiliane. Refund/kughairi hakushughulikiwi kiotomatiki.",
    ],
    buttons: [["💬 Muulize Sarah"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_tradingview: {
    match: [
      "nahitaji tradingview",
      "akaunti ya tradingview",
      "je nahitaji tradingview",
      "lazima niwe na tradingview",
      "bila tradingview",
      "sina tradingview",
    ],
    replies: [
      "Indicators vya TradingView EzyMap (Lite/Pro) vinahitaji akaunti ya TradingView ya bure au ya kulipia. Bundle ya MT5 na indicators vya mmoja mmoja (Drawdown Guardian, Bulk Close, Auto TPSL, Currency Strength Meter, MTF Bias) vinafanya kazi kwenye MT5 badala yake, hivyo havihitaji TradingView.",
    ],
    buttons: [["📊 Pata TradingView BURE"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_stuck: {
    match: [
      "nimekwama",
      "nimekwama wakati wa kujisajili",
      "nimekwama kwenye malipo",
      "usajili umekwama",
      "malipo yamekwama",
      "haiendelei",
      "imekwama",
    ],
    replies: [
      "Pitia tena hatua za Open Account au Change IB kutoka kwenye menyu ya vifurushi, au mtumie Sarah ujumbe moja kwa moja naye atakusaidia kulitatua.",
    ],
    buttons: [["💬 Muulize Sarah"], ["⬅ Rudi kwa Maswali"]],
  },
  faq_android: {
    match: [
      "siwezi kupakua vantage",
      "vantage haipakuliwi",
      "app ya vantage android",
      "pakua android",
      "simu ya android",
      "vantage kwenye android",
      "apk ya vantage",
    ],
    replies: [
      "Una shida kupakua app ya Vantage kwenye Android? Bonyeza hapa chini kupata link ya kupakua moja kwa moja.",
    ],
    buttons: [["📲 Pakua kwa Android"], ["⬅ Rudi kwa Maswali"]],
  },
  hours: {
    match: [
      "saa za kazi",
      "muda wa kazi",
      "mnafunguliwa saa ngapi",
      "mko wazi lini",
      "saa ngapi mnafungua",
      "muda wa huduma",
      "mnafanya kazi lini",
    ],
    replies: [
      "Bot iko hapa 24/7, na Sarah anajibu mwenyewe mchana kutwa — tuma ujumbe wakati wowote naye atakujibu haraka iwezekanavyo.",
    ],
  },
  contact: {
    match: [
      "mawasiliano",
      "wasiliana",
      "namba ya simu",
      "nambari ya simu",
      "nipigie",
      "barua pepe",
      "whatsapp yenu",
      "namba yenu",
    ],
    replies: [
      "Njia rahisi zaidi ni hapa hapa, rafiki — bonyeza Muulize Sarah naye atakuhudumia mwenyewe.",
    ],
    buttons: [["💬 Muulize Sarah"]],
  },
  thanks: {
    match: ["asante", "asante sana", "ahsante", "shukrani", "nashukuru", "asanteni"],
    replies: [
      "Aww, karibu sana rafiki 💛 Niko umbali wa ujumbe mmoja tu wakati wowote unaponihitaji.",
      "Wakati wowote, kwa kweli. Napenda kusaidia, nitumie ujumbe tu wakati wowote.",
    ],
  },
  help: {
    match: [
      "msaada",
      "nisaidie",
      "naomba msaada",
      "saidia",
      "usaidizi",
      "nahitaji msaada",
      "nisaidieni",
    ],
    replies: [
      "Niko hapa kwa ajili yako! Niulize kuhusu vifurushi vyetu, bei, au faida za bure za broker, nami nitakuelekeza hatua kwa hatua.",
    ],
    buttons: [["🛍 Bidhaa (Bure & Kununua)"], ["❓ Nina Swali Lingine"]],
  },
};
