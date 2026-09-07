import type { Translation } from "./replies.i18n";

/** Simplified Chinese layer over the English reply book (see replies.i18n.ts). */
export const ZH: Translation = {
  greeting: {
    match: ["你好", "您好", "嗨", "哈喽", "早上好", "下午好", "晚上好", "在吗", "hi"],
    replies: [
      "嗨亲，我是 Sarah！很高兴认识新朋友，今天有什么可以帮你的吗？",
      "嘿，你好呀！谢谢你的消息，想了解些什么呢？",
    ],
    buttons: [["🛍 产品（免费 & 购买）"], ["❓ 我有其他问题"]],
  },
  products: {
    match: ["价格", "多少钱", "费用", "收费", "产品", "指标", "ezymap", "购买", "套餐", "买"],
    replies: [
      "我们有几款产品可能很适合你。先看看，告诉我哪一个吸引你 ✨",
      "看你想要什么啦亲。这是我们的产品，从下面挑一个吧。",
    ],
    buttons: [["🎯 signal 套餐"], ["📈 TradingView", "🖥 MT5 工具"]],
  },
  tv_products: {
    match: [
      "tradingview",
      "trading view",
      "tv指标",
      "tv 指标",
      "tradingview指标",
      "tradingview产品",
    ],
    replies: ["这是我们 TradingView 上的产品。选一个版本查看价格。"],
    buttons: [["EzyMap Lite", "EzyMap Pro"], ["⬅ 返回"]],
  },
  tv_lite: {
    match: ["tv lite", "ezymap lite", "tradingview lite", "lite版", "lite 版", "精简版"],
    replies: [
      "TradingView EzyMap Lite 为你提供 TradingView 上的绘图和结构标注工具，不含实时 signal，是更实惠的入门选择。一次付费，终身使用。",
    ],
    buttons: [["终身 – $49"], ["⬅ 返回"]],
  },
  tv_pro: {
    match: ["tv pro", "ezymap pro", "tradingview pro", "pro版", "pro 版", "专业版"],
    replies: [
      "TradingView EzyMap Pro 为你提供完整 indicator，含从 M1 到 H4 的实时 signal，如果你已经在 TradingView 上交易，这款非常合适。一次付费，终身使用。",
    ],
    buttons: [["终身 – $249"], ["⬅ 返回"]],
  },
  mt5_products: {
    match: ["mt5", "mt5指标", "mt5 指标", "mt5工具", "mt5 工具", "mt5套装", "mt5 套装", "mt5全套"],
    replies: [
      "这是我们 MT5 上的全部产品。完整套装包含全部 17 个 indicator，也可以只选你需要的那一个。",
    ],
    buttons: [
      ["MT5 完整套装（价值 $999）"],
      ["Bulk Close", "Drawdown Guardian"],
      ["Auto TPSL", "Currency Strength"],
      ["MTF Bias"],
      ["⬅ 返回"],
    ],
  },
  mt5_bundle: {
    match: [
      "mt5指标套装",
      "mt5 指标套装",
      "完整套装",
      "全套指标",
      "指标套装",
      "全部指标",
      "full bundle",
    ],
    replies: [
      "完整套装一次性为你提供全部 17 个 MT5 EzyMap indicator，想要全部功能的话这是最划算的选择。",
    ],
    buttons: [["1 个月 – $99"], ["6 个月 – $499"], ["1 年 – $999"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  mt5_bulk_close: {
    match: ["bulk close", "layer close", "批量平仓", "一键平仓", "分层平仓", "部分止盈"],
    replies: [
      "Bulk Close 让你快速在任意数量的分层仓位上部分 take profit 平仓。我们的销量冠军，名副其实。",
    ],
    buttons: [["1 个月 – $19"], ["6 个月 – $109"], ["1 年 – $199"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  mt5_drawdown_guardian: {
    match: [
      "drawdown guardian",
      "drawdown",
      "prop firm",
      "回撤",
      "回撤保护",
      "回撤监控",
      "自营公司",
      "考核",
    ],
    replies: [
      "Drawdown Guardian 随时提醒你当前的 drawdown 情况，让你不会在 prop firm 考核中被淘汰。深受我们 prop firm 交易者的喜爱。",
    ],
    buttons: [["1 个月 – $9"], ["6 个月 – $49"], ["1 年 – $99"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  mt5_auto_tpsl: {
    match: ["auto tpsl", "tp sl", "止盈止损", "自动止盈", "自动止损", "自动止盈止损", "tpsl"],
    replies: ["Auto TPSL 省去你为每一层仓位手动设置 TP 和 SL 的麻烦。少操一份心。"],
    buttons: [["1 个月 – $9"], ["6 个月 – $49"], ["1 年 – $99"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  mt5_currency_strength: {
    match: [
      "currency strength",
      "strength meter",
      "volatility",
      "货币强弱",
      "货币强度",
      "强弱指标",
      "波动率",
      "波动性",
    ],
    replies: ["Currency Strength Meter 让你一眼掌握主要交易货币当前的波动情况。"],
    buttons: [["1 个月 – $9"], ["6 个月 – $49"], ["1 年 – $99"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  mt5_mtf_bias: {
    match: [
      "mtf bias",
      "multi timeframe bias",
      "多周期",
      "多时间框架",
      "多周期偏向",
      "多周期趋势",
      "趋势偏向",
    ],
    replies: ["MTF Bias 揭示多头或空头偏向，随行情变化为你的交易计划提供共振确认。"],
    buttons: [["1 个月 – $9"], ["6 个月 – $49"], ["1 年 – $99"], ["🎁 试用 3 天"], ["⬅ 返回"]],
  },
  broker: {
    match: [
      "vantage",
      "经纪商",
      "券商",
      "开户",
      "免费账户",
      "新手",
      "vip",
      "免费",
      "信号",
      "电子书",
      "优惠",
      "促销",
      "赠金",
      "入金赠金",
      "下载app",
      "下载 app",
      "vantage app",
      "注册vantage",
      "注册 vantage",
      "ezyscalper",
      "ezyintraday",
      "ezyswing",
      "elite circle",
    ],
    replies: [
      "我们的交易合作经纪商是 Vantage Markets，Jack 用了他们好多年，出金快、执行也快。在他的 IB 下开户还能解锁免费福利：电子书、signal、indicator，具体看你的等级，无需额外付费。",
    ],
    buttons: [
      ["🎁 查看套餐"],
      ["📝 通过 Telegram 机器人注册"],
      ["🎁 优惠活动 & 奖励"],
      ["📲 下载 Vantage App"],
    ],
  },
  faq: {
    match: ["faq", "常见问题", "问题", "其他问题", "我有问题", "我想问", "请问", "咨询"],
    replies: ["有问题吗？从下面选一个，我马上在这里回答你 ✨"],
    buttons: [
      ["加入是免费的吗？"],
      ["免费套餐和付费套餐有什么区别？"],
      ["要入金多少？"],
      ["Elite 包含什么？"],
      ["已经有 Vantage 账户？"],
      ["多久能解锁？"],
      ["怎么付款？"],
      ["退款或取消？"],
      ["需要 TradingView 吗？"],
      ["注册/付款时卡住了？"],
      ["Vantage App 无法下载（安卓）"],
    ],
  },
  faq_free: {
    match: ["加入免费吗", "免费的吗", "真的免费吗", "免费加入", "是免费的吗", "要收费吗"],
    replies: [
      "是的！Free 等级和 30 天 Vantage 试用完全免费 —— 试用只需要在 Jack 的 IB 下开一个 Vantage Markets 账户。只有付费套餐（Pro $49、Premium $99、Elite $299）和 EzyMap indicator 才需要付费。",
    ],
    buttons: [["🎁 查看套餐"], ["⬅ 返回常见问题"]],
  },
  faq_difference: {
    match: [
      "免费和付费的区别",
      "套餐区别",
      "套餐有什么区别",
      "免费套餐和购买",
      "有什么不同",
      "区别",
    ],
    replies: [
      "Free 等级和 Vantage 试用是根据你在 Jack 的 IB 下的经纪商账户状态解锁的。Pro、Premium 和 Elite 是付费会员，包含完整的交易流程和 signal 推送。EzyMap indicator（TradingView / MT5）是单独的一次性购买产品。",
    ],
    buttons: [["⬅ 返回常见问题"]],
  },
  faq_deposit: {
    match: ["入金多少", "最低入金", "要入金多少", "最少存多少", "存款多少", "入金要求"],
    replies: [
      "Vantage 试用只需要在 Jack 的 IB 下开一个真实账户 —— 任意金额入金即可开始。付费套餐完全不需要经纪商入金。",
    ],
    buttons: [["🎁 查看套餐"], ["⬅ 返回常见问题"]],
  },
  faq_elite: {
    match: [
      "elite",
      "elite包含什么",
      "elite 包含什么",
      "elite套餐",
      "elite 套餐",
      "elite有什么",
      "elite福利",
    ],
    replies: [
      "包含 Premium 的全部内容，再加上完整的 EzyMap MT5 indicator 套装（Drawdown Guardian、Bulk Close 含 Layer Close、Auto TPSL 等），以及 Ezy Elite Circle，可获得 Jack 的一对一支持。",
    ],
    buttons: [["🎁 查看套餐"], ["⬅ 返回常见问题"]],
  },
  faq_existing_account: {
    match: [
      "已经有vantage账户",
      "已经有 vantage 账户",
      "已有账户",
      "已经有账户",
      "已经开过户",
      "换ib",
      "更换ib",
      "change ib",
    ],
    replies: [
      "可以！不用新开账户，改用 Change IB（更换 IB）即可（通过邮件办理，不是链接），然后按同样的方式提交你的资料。",
    ],
    buttons: [["🎁 查看套餐"], ["⬅ 返回常见问题"]],
  },
  faq_unlock_time: {
    match: ["多久解锁", "什么时候解锁", "多久能解锁", "多久开通", "什么时候开通", "解锁时间"],
    replies: [
      "付费套餐在付款到账的那一刻自动解锁 —— 可以用 /status 查看。Vantage 试用在你确认账户已在 Jack 的 IB 下开通后立即解锁。",
    ],
    buttons: [["⬅ 返回常见问题"]],
  },
  faq_how_to_pay: {
    match: ["怎么付款", "如何付款", "怎么支付", "支付方式", "付款方式", "指标怎么付款", "怎么买"],
    replies: [
      "套餐通过机器人发给你的安全结账链接用银行卡支付 —— 付款到账后权限会自动开通。EzyMap indicator 的话，告诉我你要哪一款，Sarah 会在这里把付款信息发给你。",
    ],
    buttons: [["🎯 查看套餐"], ["⬅ 返回常见问题"]],
  },
  faq_refund: {
    match: ["退款", "退钱", "取消购买", "可以退款吗", "能退款吗", "取消订单"],
    replies: ["请直接联系 Sarah 商量。退款/取消不会自动处理。"],
    buttons: [["💬 咨询 Sarah"], ["⬅ 返回常见问题"]],
  },
  faq_tradingview: {
    match: [
      "需要tradingview吗",
      "需要 tradingview 吗",
      "要tradingview账户吗",
      "tradingview账户",
      "tradingview 账户",
      "没有tradingview",
    ],
    replies: [
      "TradingView EzyMap indicator（Lite/Pro）需要一个免费或付费的 TradingView 账户。MT5 套装和单个 indicator（Drawdown Guardian、Bulk Close、Auto TPSL、Currency Strength Meter、MTF Bias）则在 MT5 上运行，这些不需要 TradingView。",
    ],
    buttons: [["📊 免费获取 TradingView"], ["⬅ 返回常见问题"]],
  },
  faq_stuck: {
    match: ["卡住了", "注册卡住", "付款卡住", "我卡住了", "注册失败", "付款失败", "进行不下去"],
    replies: [
      "从套餐菜单重新走一遍开户或 Change IB（更换 IB）的步骤，或者直接联系 Sarah，她会帮你解决。",
    ],
    buttons: [["💬 咨询 Sarah"], ["⬅ 返回常见问题"]],
  },
  faq_android: {
    match: [
      "安卓下载不了",
      "vantage安卓",
      "vantage 安卓",
      "安卓app",
      "安卓 app",
      "无法下载vantage",
      "下载不了vantage",
      "android",
    ],
    replies: ["安卓手机下载 Vantage App 遇到问题？点击下方获取直接下载链接。"],
    buttons: [["📲 下载安卓版"], ["⬅ 返回常见问题"]],
  },
  hours: {
    match: ["营业时间", "工作时间", "几点上班", "什么时候在线", "在线时间", "服务时间", "几点开门"],
    replies: ["机器人 24/7 全天候在线，Sarah 白天会亲自回复 —— 随时留言，她会尽快回复你。"],
  },
  contact: {
    match: ["联系", "联系方式", "电话", "电话号码", "打电话", "whatsapp", "微信", "邮箱", "email"],
    replies: ["最方便的就是在这里啦亲 —— 点一下「咨询 Sarah」，她会亲自接待你。"],
    buttons: [["💬 咨询 Sarah"]],
  },
  thanks: {
    match: ["谢谢", "谢啦", "感谢", "多谢", "辛苦了", "thanks", "thank you"],
    replies: [
      "哎呀，不客气亲 💛 需要我的时候，随时发消息就好。",
      "随时都可以，真的。我很乐意帮忙，有事随时找我。",
    ],
  },
  help: {
    match: ["帮助", "帮忙", "帮我", "客服", "支持", "求助", "help"],
    replies: ["我在这里！问我关于套餐、价格或免费经纪商福利的问题，我会一步步告诉你。"],
    buttons: [["🛍 产品（免费 & 购买）"], ["❓ 我有其他问题"]],
  },
};
