"use strict";

const SAVE_KEY = "ghostShiftSaveV2";
const LEGACY_SAVE_KEY = "ghostShiftSave";

const STAT_LABELS = {
  virtue: "阴德",
  kpi: "KPI",
  exposure: "曝光度",
  speech: "话术",
  pressure: "镇魂",
  attachment: "人间牵挂",
  resentment: "亡魂怨念"
};

const ABILITY_LABELS = {
  speech: "话术",
  soul: "镇魂",
  etiquette: "通礼"
};

const SPELL_LABELS = {
  dream: "托梦",
  concealment: "障眼法",
  moveObject: "移物",
  soulLock: "锁魂"
};

const HIDDEN_FLAG_KEYS = new Set([
  "auditRisk",
  "baiqiTrust",
  "baiqiSteal",
  "baiqiCoop",
  "baiqiGrudge",
  "baiqiAlliance",
  "baiqiConflict"
]);

const INVENTORY_LABELS = {
  badge: "临时鬼差工牌",
  handbook: "《新鬼差入职手册》",
  soup: "孟婆汤低糖试饮装",
  money: "冥币备用金",
  spring: "迟到的一句话",
  handkerchief: "兰芳的手帕",
  bottle: "低糖空瓶"
};

const FLAG_LABELS = {
  knownRing: "戒指线索",
  dreamPlan: "托梦方案",
  houseConflict: "房子矛盾",
  scamInfo: "阴间诈骗线索",
  phoneComplaint: "纸扎手机隐患",
  clockAbnormal: "座钟异常",
  clockImportant: "旧座钟重要",
  baiqiTrust: "白七好感",
  baiqiSteal: "白七抢绩效",
  baiqiCoop: "白七合作",
  baiqiGrudge: "白七记仇",
  doudouRemembers: "豆豆记得你",
  orangeStolen: "小鬼偷橘子",
  ringFound: "戒指被发现",
  memoryGap: "记忆缺口",
  auditRisk: "审计关注",
  rulesChecked: "已核对头七规则",
  paperMoneyReversed: "纸钱烧反",
  neighborKnock: "邻居敲门",
  incenseOut: "香火中断",
  doudouDrawing: "豆豆的画像",
  fakeRule: "白七的假规则",
  lanfangCough: "许兰芳咳嗽",
  drawerConflict: "翻抽屉冲突",
  stationInspection: "站长定位抽查",
  doudouConnection: "豆豆长期联系",
  baiqiAlliance: "白七协作关系",
  baiqiConflict: "白七后续冲突",
  liuFamilyVisit: "刘家清明回访",
  trialWatch: "试用期观察"
};

const START_STATE = {
  schemaVersion: 2,
  current: "S00",
  profile: {
    routes: { virtue: 0, kpi: 0, attachment: 0 },
    abilities: { speech: 0, soul: 0, etiquette: 0 },
    spells: { dream: false, concealment: false, moveObject: false, soulLock: false },
    inventory: {
      badge: 1,
      handbook: 1,
      soup: 1,
      money: 3,
      spring: 0,
      handkerchief: 0,
      bottle: 0
    },
    relations: { baiqi: 0, doudou: 0 },
    flags: {},
    completedCases: [],
    caseHistory: []
  },
  case: {
    id: "case-liu-shuncai-01",
    name: "刘顺才头七回魂协助",
    phase: "入职",
    started: false,
    risks: { exposure: 0, resentment: 0 },
    flags: {},
    loadout: {
      artifact: null,
      consumables: { soup: 0, spring: 0, handkerchief: 0, bottle: 0 },
      money: 0,
      preset: "未配置"
    },
    usages: { badge: false, handbook: false },
    random: { seed: null, incidentId: null, resolved: false },
    injuries: [],
    settlement: null,
    rewardedEnding: null
  },
  history: ["死亡业务综合受理大厅叫到了你的号。"],
  undo: []
};

const SCENES = {
  S00: {
    chapter: "死亡当天 00:00",
    title: "地府便民服务中心",
    body: [
      "你睁开眼的时候，第一眼看见的不是白光。",
      "是一块电子屏。上面写着：地府便民服务中心，死亡业务综合受理大厅。",
      "下面还有一行滚动字幕：请新亡魂自觉取号。插队者将视情况安排孟婆汤加冰。",
      "你低头看了看自己。脚不沾地，手有点透明，胸口没有起伏。旁边一个老爷子捧着号码条，神情肃穆地问工作人员：同志，投胎窗口在哪边？",
      "窗口里坐着一个年轻人，胸牌写着：判官助理小陆。你终于意识到一件事：你死了。更糟的是，死后办事也要排队。"
    ],
    choices: [
      {
        label: "老实取号",
        meta: "你在人间都排了这么多年队，死了也不差这一回。",
        to: "S01",
        effects: { stats: { virtue: 1 } }
      },
      {
        label: "试图插队",
        meta: "反正都死了，脸皮应该也算遗产的一部分。",
        to: "S01",
        effects: { stats: { pressure: 1, exposure: 1 } }
      },
      {
        label: "跟窗口套近乎",
        meta: "哥，我看您骨骼清奇，像是地府栋梁。",
        to: "S01",
        effects: { stats: { speech: 1 } }
      },
      {
        label: "站在原地发呆",
        meta: "认真思考人生为什么能烂尾成这样。",
        to: "S01",
        effects: { stats: { attachment: 1 } }
      }
    ]
  },

  S01: {
    chapter: "死亡当天 01:00",
    title: "死亡确认面试",
    body: [
      "你坐在小陆面前。他翻了翻你的档案，皱眉：你这个情况有点特殊。",
      "你心里一紧：我是死错了？",
      "小陆说：不是。你死得挺准。",
      "他继续看表：阳寿结束，因果未清，执念未散。正常流程是排队等复核，大概要等一百二十七年。",
      "旁边办公室忽然传出怒吼：接引科又缺人？上周不是刚招了三个吗？小陆看向你的眼神，忽然变得像招聘软件。"
    ],
    choices: [
      {
        label: "我刚死，能不能先悲伤一下？",
        to: "S02",
        effects: { stats: { attachment: 1 } }
      },
      {
        label: "有五险一金吗？",
        to: "S02",
        effects: { stats: { speech: 1 } }
      },
      {
        label: "只要不排一百二十七年，我都可以",
        to: "S02",
        effects: { stats: { kpi: 1 } }
      },
      {
        label: "我拒绝",
        meta: "小陆递来《拒绝基层就业后果知情书》，一共四百页。",
        to: "S02",
        effects: { stats: { pressure: 1 } }
      }
    ]
  },

  S02: {
    chapter: "死亡当天 01:20",
    title: "临时鬼差录用",
    body: [
      "十分钟后，你坐进一间小会议室。门牌写着：阴司基层岗位临时补录面试室。",
      "桌子对面坐着马面站长。他戴着工牌，喝着枸杞茶，表情慈祥得很职业。",
      "马面说：我们这里讲究自愿。你看了一眼门口，两个牛头堵在那里，一个在啃煎饼果子，一个在看短视频。",
      "他把一份《阴阳中转驿站实习鬼差劳务合作协议》推到你面前。完成 KPI 可获得阴德、道具、轮回优先权或短期还阳申请资格。",
      "马面说：你选个入职方向吧。虽然都是干活，但心理安慰也很重要。"
    ],
    choices: [
      {
        label: "安抚方向",
        meta: "熟悉镇魂，解锁托梦。",
        to: "S03",
        effects: {
          stats: { virtue: 1 },
          abilities: { soul: 1 },
          spells: { dream: true }
        }
      },
      {
        label: "外勤方向",
        meta: "熟悉通礼，解锁移物。",
        to: "S03",
        effects: {
          stats: { kpi: 1 },
          abilities: { etiquette: 1 },
          spells: { moveObject: true }
        }
      },
      {
        label: "谈判方向",
        meta: "熟悉话术，解锁障眼法。",
        to: "S03",
        effects: {
          stats: { speech: 1 },
          spells: { concealment: true }
        }
      },
      {
        label: "危机方向",
        meta: "熟悉镇魂，解锁锁魂。",
        to: "S03",
        effects: {
          stats: { pressure: 1 },
          spells: { soulLock: true }
        }
      }
    ]
  },

  S03: {
    chapter: "死亡当天 03:00",
    title: "阴阳中转驿站",
    body: [
      "驿站藏在一条老街尽头。白天看，它像一家关门多年的钟表修理铺。晚上看，它像一家关门多年的钟表修理铺，但招牌会自己亮起来：阴阳中转驿站。",
      "小字写着：代办接引、安魂、托梦、纸扎售后。投诉请烧至地府总务处。",
      "马面递给你四样东西：临时鬼差工牌，孟婆汤低糖试饮装，冥币备用金三枚，还有一本《新鬼差入职手册》。",
      "你翻开手册第一页：如何判断亡魂是否愿意走。下面被前任实习生写了一行：问了也白问，大多数都说不愿意。",
      "这时，驿站墙上的铜铃响了一下。马面抬头：来单了。"
    ],
    choices: [
      {
        label: "查看派工单并配置出勤物品",
        meta: "接案：乙亥街 17 号头七回魂协助。",
        to: "S03L",
        primary: true
      }
    ]
  },

  S03L: {
    chapter: "接案 · 出勤配置",
    title: "驿站物资台",
    body: [
      "派工单落进你手里：刘顺才，六十七岁，病逝，头七回魂协助。主要风险是阳间目击与亡魂怨念。",
      "工牌与入职手册属于身份物品，不占出勤格，每件每案只能调用一次。",
      "你目前没有法器或纪念物；消耗品有一瓶孟婆汤低糖试饮装。冥币钱包最多装五枚。",
      "马面敲了敲桌面：带什么由你。现场失败不会倒带，只会带着代价继续走流程。"
    ],
    choices: [
      {
        label: "标准配置：携带孟婆汤",
        meta: "装入 1 件消耗品，并带上现有冥币。",
        to: "RX",
        loadout: "standard",
        primary: true
      },
      {
        label: "轻装出勤：不带消耗品",
        meta: "保留孟婆汤，只带冥币；危机时少一条退路。",
        to: "RX",
        loadout: "light"
      },
      {
        label: "用入职手册核对规则后出勤",
        meta: "本案消耗一次手册查阅机会，通礼 +1，并采用标准配置。",
        requires: { inventory: "handbook", gte: 1 },
        successTo: "RX",
        failTo: "RX",
        loadout: "standard",
        successEffects: {
          inventory: { handbook: -1 },
          abilities: { etiquette: 1 },
          flags: { rulesChecked: true }
        },
        failLog: "手册本案已经查过，只能凭记忆出勤。"
      }
    ]
  },

  S04: {
    chapter: "入职第 1 天",
    title: "乙亥街 17 号",
    body: [
      "乙亥街 17 号是一栋老楼。楼道声控灯亮两秒，灭三秒，主打一个阴阳两界都不太想负责。",
      "门没关严，里面是临时布置的灵堂。遗像上的老人戴着老花镜，笑得很温和。桌上有香，有供饭，有水果，还有一只旧座钟。",
      "亡魂刘顺才站在灵堂旁边，低头看着自己的遗像。他看见你，第一句话是：小同志，我是不是耽误你下班了？",
      "客厅里传来争吵。大儿子刘明远想谈房子，小女儿刘明溪坚持头七前不谈。许兰芳坐在沙发上，手里攥着旧手帕，没说话。",
      "刘顺才的魂影轻轻晃了一下。"
    ],
    choices: [
      { label: "先和刘顺才谈", meta: "弄清他为什么不肯走。", to: "S05" },
      { label: "先偷听家属争吵", meta: "找出矛盾点。", to: "S06" },
      { label: "先检查灵堂和供品", meta: "确认礼仪环节有没有问题。", to: "S07" },
      {
        label: "给马面发消息",
        meta: "消耗 1 枚冥币作为阴间通讯费。",
        to: "S08",
        requires: { inventory: "money", gte: 1 },
        effects: { inventory: { money: -1 }, flags: { clockImportant: true } },
        failTo: "S05",
        failEffects: { stats: { kpi: -1 } },
        failLog: "冥币不足，阴间通讯自动转为欠费停机。"
      }
    ]
  },

  S05: {
    chapter: "任务调查",
    title: "亡魂的心愿",
    body: [
      "你走到刘顺才身边。他看起来不像传说里的鬼，更像一个刚从午睡中醒来的老人。手指还保持着修钟表时的习惯，轻轻摩挲着不存在的小螺丝刀。",
      "刘顺才说：我知道我死了。小同志，你别难开口。",
      "你问：那您为什么还不走？",
      "他看向桌上的旧座钟：那里面有个东西。我本来想等兰芳生日那天给她，结果没等到。",
      "那是一枚戒指，不新，也不贵。还有一张纸条。他想让许兰芳知道，他没把日子过明白，但他没忘。"
    ],
    choices: [
      {
        label: "我帮您把戒指送到她手里",
        to: "S09",
        effects: { stats: { virtue: 1 }, flags: { knownRing: true } }
      },
      {
        label: "按规定，亡魂不得干预阳间财物",
        to: "S09",
        effects: { stats: { kpi: 1, resentment: 1 } }
      },
      {
        label: "您自己去托梦给她，我帮您看门",
        meta: "需要阴德 1。",
        requires: { stat: "virtue", gte: 1 },
        successTo: "S09",
        failTo: "S09",
        successEffects: { flags: { dreamPlan: true } },
        failEffects: { stats: { exposure: 1 } },
        successLog: "你的语气够稳，刘顺才相信了托梦方案。",
        failLog: "托梦流程卡住，屋里的灯闪了一下。"
      },
      {
        label: "先别管戒指，能不能给我五星好评？",
        to: "S09",
        effects: { stats: { kpi: 1, virtue: -1 } }
      }
    ]
  },

  S06: {
    chapter: "任务调查",
    title: "家属争吵",
    body: [
      "你飘到客厅角落。刘明远的声音压得很低，但每个字都像在找出口。",
      "他说自己不是要赶母亲，只是想卖掉老楼，给她换个电梯房。刘明溪冷笑，问这里面有没有他的贷款。",
      "许兰芳终于开口：别吵了。他还在屋里。",
      "两兄妹都沉默了一瞬。只有豆豆从小板凳上抬起头，朝你的方向看了一眼。",
      "你背后一凉。一个活人小孩好像看见你了。"
    ],
    choices: [
      {
        label: "给刘明溪托一个别吵的念头",
        meta: "需要嘴遁 1。",
        requires: { stat: "speech", gte: 1 },
        successTo: "S09",
        failTo: "S10",
        successEffects: { stats: { virtue: 1 } },
        failEffects: { stats: { exposure: 1 } }
      },
      { label: "先安抚豆豆", meta: "避免他喊出声。", to: "S10" },
      {
        label: "不干预，继续观察",
        to: "S09",
        effects: { stats: { resentment: 1 }, flags: { houseConflict: true } }
      },
      {
        label: "直接把刘明远手机屏幕弄黑",
        to: "S10",
        effects: { stats: { kpi: 1, exposure: 1 } }
      }
    ]
  },

  S07: {
    chapter: "任务调查",
    title: "灵堂检查",
    body: [
      "香是点着的，供饭摆着，水果也还新鲜。整体没有大问题，但细节不少。",
      "旧座钟被摆在遗像旁边，钟摆已经停了，指针卡在 7 点 17 分。",
      "桌角还有一叠纸钱，旁边压着一只纸扎手机。手机背面写着：爸，去了那边也要常联系。",
      "你拿起纸扎手机，屏幕忽然亮了。来电显示：未知号码，阴间反诈中心。",
      "机械女声响起：检测到您有一笔高额功德即将到账，请按 1 转人工判官。"
    ],
    choices: [
      {
        label: "立刻挂断纸扎手机",
        meta: "避免亡魂被诈骗。",
        to: "S09",
        effects: { stats: { virtue: 1 } }
      },
      {
        label: "按 1 听听",
        meta: "消耗 1 枚冥币。",
        requires: { inventory: "money", gte: 1 },
        successTo: "S09",
        failTo: "S09",
        successEffects: { inventory: { money: -1 }, flags: { scamInfo: true } },
        failEffects: { stats: { kpi: -1 } },
        successLog: "你确认了一件事：阴间诈骗也很卷。",
        failLog: "余额不足，反诈中心反手给你记了一笔咨询费。"
      },
      {
        label: "把纸扎手机交给刘顺才",
        to: "S09",
        effects: { stats: { resentment: -1 }, flags: { phoneComplaint: true } }
      },
      {
        label: "检查旧座钟",
        to: "S11",
        effects: { flags: { clockAbnormal: true } }
      }
    ]
  },

  S08: {
    chapter: "场外求助",
    title: "马面站长的提示",
    body: [
      "你掏出工牌，给马面站长发消息：站长，第一单就家庭矛盾、遗物误会、敏感小孩，正常吗？",
      "马面秒回：正常。你以为亡魂不走是因为舍不得人间，其实多数是人间没把话说完。",
      "过了两秒，他又发来一条：本单注意三件事。第一，头七回魂不能拖到天亮。第二，别让小孩看见你。第三，旧座钟。",
      "你问：旧座钟怎么了？",
      "马面回：你问我？你是外勤。"
    ],
    choices: [
      { label: "收起工牌，继续办事", to: "S09", primary: true }
    ]
  },

  S09: {
    chapter: "任务竞争",
    title: "白七抢单",
    body: [
      "房间角落忽然冒出一股冷气。一个穿着白色制服的鬼差从墙里钻出来，动作潇洒得像上班迟到但要假装自己是巡视。",
      "他亮出工牌：白七，乙亥片区资深外勤。这个刘顺才，我盯三天了。",
      "你看了一眼派工单：可系统派给我了。",
      "白七叹气：新鬼就是天真。系统派单是系统派单，最后结算看谁完成关键动作。",
      "刘顺才听不见你们的 KPI 争执，只是站在遗像旁边，越来越焦急。"
    ],
    choices: [
      {
        label: "跟白七硬刚",
        meta: "需要怨念承压 1。",
        requires: { stat: "pressure", gte: 1 },
        successTo: "S11",
        failTo: "S11",
        successEffects: { stats: { kpi: 1 } },
        failEffects: { stats: { kpi: -1 } }
      },
      {
        label: "嘴遁带教绩效",
        meta: "需要嘴遁 1。",
        requires: { stat: "speech", gte: 1 },
        successTo: "S11",
        failTo: "S11",
        successEffects: { flags: { baiqiTrust: true } },
        failEffects: { stats: { kpi: -1 }, flags: { baiqiSteal: true } }
      },
      {
        label: "提议合作",
        meta: "你处理遗愿，他负责天亮前接引。",
        to: "S11",
        effects: { stats: { virtue: 1, kpi: -1 }, flags: { baiqiCoop: true } }
      },
      {
        label: "截图举报",
        meta: "站长，有人抢单。",
        to: "S11",
        effects: { stats: { kpi: 1 }, flags: { baiqiGrudge: true } }
      }
    ]
  },

  S10: {
    chapter: "阳间风险",
    title: "豆豆看见了你",
    body: [
      "豆豆抱着一辆掉了轮子的玩具车，坐在灵堂边的小板凳上。他没有看遗像，也没有看大人。",
      "他在看你。",
      "他小声问：你是来接外公的吗？",
      "你僵在原地。入职手册第一页用红字写过：如果活人看见你，请保持镇定。不要尖叫。通常尖叫的是活人，但我们不排除新员工心理素质较差。",
      "豆豆又问：外公会疼吗？"
    ],
    choices: [
      {
        label: "使用临时鬼差工牌",
        meta: "让豆豆短暂忽略你。",
        requires: { inventory: "badge", gte: 1 },
        successTo: "S09",
        failTo: "S09",
        successEffects: { inventory: { badge: -1 }, stats: { exposure: -1 } },
        failEffects: { stats: { exposure: 1 } }
      },
      {
        label: "温柔回答",
        meta: "不会了，他只是要去很远的地方。",
        to: "S09",
        effects: { stats: { virtue: 1, exposure: 1 }, flags: { doudouRemembers: true } }
      },
      {
        label: "装成墙上的影子",
        meta: "需要嘴遁 1。",
        requires: { stat: "speech", gte: 1 },
        successTo: "S09",
        failTo: "S09",
        failEffects: { stats: { exposure: 1 } }
      },
      {
        label: "吓他一下",
        meta: "让他不敢再看。",
        to: "S09",
        effects: { stats: { exposure: -1, virtue: -1, attachment: -1 } }
      }
    ]
  },

  S11: {
    chapter: "关键线索",
    title: "旧座钟",
    body: [
      "你走到旧座钟旁边。这只钟很老，木壳边缘被磨得发亮，像被很多年日子慢慢摸圆了脾气。",
      "钟摆停在里面，指针卡在 7 点 17 分。",
      "刘顺才飘过来，小声说：那是我和兰芳第一次看电影的时间。她说那天我迟到，我说没有。其实我一直记得，确实是我迟到了。",
      "你问：所以戒指在钟里？刘顺才点头：后盖有暗格。但我碰不到。",
      "你需要让活人发现暗格，又不能暴露自己。"
    ],
    choices: [
      {
        label: "给许兰芳托梦",
        meta: "需要阴德 1。",
        requires: { stat: "virtue", gte: 1 },
        successTo: "S12",
        failTo: "S12",
        successEffects: { flags: { ringFound: true } },
        failEffects: { stats: { exposure: 1 }, flags: { ringFound: true } }
      },
      {
        label: "叫一只驿站小鬼推座钟",
        meta: "消耗 1 枚冥币。",
        requires: { inventory: "money", gte: 1 },
        successTo: "S12",
        failTo: "S12",
        successEffects: {
          inventory: { money: -1 },
          flags: { ringFound: true, orangeStolen: true }
        },
        failLog: "冥币不足，小鬼拒绝加班。"
      },
      {
        label: "让刘顺才强行触碰座钟",
        to: "S12",
        effects: { stats: { resentment: 1 }, flags: { ringFound: true } }
      },
      {
        label: "你直接把后盖掀开",
        to: "S12",
        effects: { stats: { exposure: 2 }, flags: { ringFound: true } }
      },
      {
        label: "放弃戒指，优先接引",
        to: "S13",
        effects: { stats: { kpi: 1, resentment: 2 } }
      }
    ]
  },

  S12: {
    chapter: "头七前夜",
    title: "纸条",
    body: [
      "旧座钟发出一声迟来的响。许兰芳抬起头。豆豆指着钟：外婆，钟里面好像有声音。",
      "刘明溪打开暗格，从里面拿出一个小布包。布包里有一枚戒指，不新，也不贵，但被擦得很亮。",
      "还有一张纸条。上面写着：兰芳，年轻时欠你的戒指，现在补给你。要是我哪天先走了，别跟孩子们生气。他们都笨，随我。你要多吃饭，少替别人省。顺才。",
      "屋子里安静下来。刘明远把脸转到一边，声音哑了：妈，我不是想抢房子。",
      "白七低声提醒你：还有半个时辰天亮。该带他走了。"
    ],
    choices: [
      {
        label: "按流程接引刘顺才离开",
        to: "S14",
        effects: { stats: { kpi: 1 } }
      },
      {
        label: "允许他再听家人说一会儿",
        meta: "需要怨念承压 1 或阴德 2。",
        requires: {
          any: [
            { stat: "pressure", gte: 1 },
            { stat: "virtue", gte: 2 }
          ]
        },
        successTo: "S14",
        failTo: "S13",
        successEffects: { stats: { virtue: 1 } },
        failEffects: { stats: { exposure: 1 } }
      },
      {
        label: "违规让刘顺才多留一夜",
        to: "E03",
        effects: {
          stats: { virtue: 2, attachment: 1, kpi: -2, exposure: 2 },
          flags: { auditRisk: true }
        }
      },
      {
        label: "交给白七接引",
        meta: "如果此前合作，平稳结算；否则他会拿走关键绩效。",
        resolve: () => {
          if (getFlag("baiqiCoop")) {
            return { to: "E01", log: "白七按约接引，你拿到了遗愿部分的功劳。" };
          }
          return {
            to: "E02",
            effects: { stats: { kpi: -1 } },
            log: "白七接走关键动作，你的绩效被削了一截。"
          };
        }
      }
    ]
  },

  S13: {
    chapter: "危机处理",
    title: "怨念起风",
    body: [
      "屋里的灯忽然闪了一下。旧座钟开始倒走。",
      "刘顺才的魂影被一股灰色的风拉长。他看着许兰芳，看着两个孩子，看着那枚迟到了几十年的戒指，声音变得嘶哑。",
      "他说：我还没说完。",
      "桌上的纸钱哗啦啦飞起来。纸扎手机自动亮屏，开始播放阴间诈骗广告。",
      "白七骂了一句：新来的，你把怨念放大了？你想解释，但此刻解释不能算 KPI。"
    ],
    choices: [
      {
        label: "正面劝他",
        meta: "需要嘴遁 2 或阴德 2。",
        requires: {
          any: [
            { stat: "speech", gte: 2 },
            { stat: "virtue", gte: 2 }
          ]
        },
        successTo: "S14",
        failTo: "E04"
      },
      {
        label: "使用孟婆汤低糖试饮装",
        requires: { inventory: "soup", gte: 1 },
        successTo: "S14",
        failTo: "E04",
        successEffects: { inventory: { soup: -1 }, flags: { memoryGap: true } },
        failLog: "瓶子已经空了，怨念没有被压住。"
      },
      {
        label: "让白七强制锁魂",
        to: "E02",
        effects: { stats: { kpi: 2, virtue: -2 } }
      },
      {
        label: "用自己的人间牵挂压住怨气",
        meta: "需要人间牵挂 1。",
        requires: { stat: "attachment", gte: 1 },
        successTo: "S14",
        failTo: "E04",
        successEffects: { stats: { attachment: 1, virtue: 1 } }
      }
    ]
  },

  S14: {
    chapter: "任务结算前",
    title: "天亮之前",
    body: [
      "窗外天色发青。刘顺才站在门口，回头看最后一眼。",
      "许兰芳坐在灵堂前，戒指戴在手上。刘明远没有再提房子。刘明溪把纸条折好，放回布包。豆豆趴在椅背上，半睡半醒，忽然朝你的方向挥了挥手。",
      "刘顺才问你：小同志，我这样算走了吗？",
      "你说：算。",
      "他又问：那你呢？你也要走吗？你一时答不上来。你忽然想起自己也是刚死的人，甚至还没有认真想过，阳间有没有人在找你。"
    ],
    choices: [
      {
        label: "返回驿站，查看结算",
        primary: true,
        resolve: () => ({ to: resolveEnding() })
      }
    ]
  },

  E01: {
    chapter: "结局",
    title: "暖灰结局",
    body: [
      "你把刘顺才带回阴阳中转驿站。铜铃响了一下，派工单自动盖章：任务完成。亡魂状态平稳，家属执念缓和，阳间曝光可控。",
      "马面站长看完结算，点了点头：第一单能做到这样，不错。",
      "你问：有奖金吗？",
      "马面递给你一根旧座钟发条：亡魂谢礼。一次性道具，叫迟到的一句话。以后你说错一句话，可以用它倒回三秒，但只能倒回话，不能倒回锅。",
      "解锁后续支线：刘家清明回访。若豆豆记得你，后续还会出现看得见你的小孩。"
    ],
    ending: true,
    reward: { stats: { virtue: 2, kpi: 1 }, inventory: { spring: 1 } }
  },

  E02: {
    chapter: "结局",
    title: "基层优秀结局",
    body: [
      "刘顺才被准时接引。流程无误，表格漂亮，KPI 甚至超额。",
      "马面站长看着系统评价：完成效率高，阳间干预低，适合外勤培养。",
      "你松了口气。但派工单最后一栏缓缓浮出一行小字：亡魂遗憾，未完全消解。",
      "你问：这会怎样？",
      "马面喝了口茶：短期不怎样。长期可能在某个雨夜，变成你加班的原因。"
    ],
    ending: true,
    reward: { stats: { kpi: 3, virtue: -1 } }
  },

  E03: {
    chapter: "结局",
    title: "违规温情结局",
    body: [
      "你让刘顺才多留了一夜。他坐在许兰芳身边，看她把戒指取下又戴上，看她打开衣柜，找出他那件旧外套。",
      "许兰芳骂了一句：走了也不知道托梦说一声。",
      "天亮之后，你带他回驿站。马面站长站在门口，手里拿着考勤异常通知。",
      "他说：解释一下？",
      "你想了想：人间情况复杂，现场处置灵活。马面说：这句话我上次听见，是一个鬼差把纸扎挖掘机开进商场。"
    ],
    ending: true,
    reward: {
      stats: { virtue: 3, attachment: 2, kpi: -2, exposure: 2 },
      inventory: { handkerchief: 1 },
      flags: { auditRisk: true }
    }
  },

  E04: {
    chapter: "结局",
    title: "翻车培训结局",
    body: [
      "事情失控了。豆豆哭出声，大人冲进灵堂。旧座钟倒走，纸钱乱飞，纸扎手机用最大音量播放：恭喜您获得地府功德贷额度。",
      "白七强行锁魂，马面站长亲自赶来，把你和刘顺才一起带回驿站。",
      "半小时后，你坐在培训室里。墙上投影着标题：新员工常见事故复盘，如何避免第一单就写检讨。",
      "马面说：别灰心。我们这里允许犯错。",
      "你刚要感动。他补充：但不允许不写报告。"
    ],
    ending: true,
    reward: { stats: { kpi: -2, exposure: 3 } }
  },

  E05: {
    chapter: "结局",
    title: "低糖遗忘结局",
    body: [
      "孟婆汤低糖试饮装确实有效。刘顺才平静了下来。",
      "他记得许兰芳，记得孩子们，记得那间老房子，记得自己是修钟表的。",
      "但他忘了戒指为什么重要。",
      "许兰芳戴上戒指时，他只是安静地看着，像看一件与自己有关、却隔着雾的旧物。",
      "回到驿站后，马面看了看任务记录：处理得不差，但记住，忘记不是放下。它只是把结打到更深的地方。"
    ],
    ending: true,
    reward: {
      stats: { kpi: 1, virtue: 1 },
      inventory: { bottle: 1 },
      flags: { memoryGap: true }
    }
  }
};

const INCIDENTS = [
  {
    id: "paper-money-reversed",
    title: "纸钱烧反了",
    body: [
      "你刚到楼下，一叠纸钱从门缝里飘出来。刘顺才收到的不是冥币，而是一沓写着“仅限阳间使用”的代金券。",
      "他盯着满减规则看了半天：我都死了，还差二十才能用？"
    ],
    choices: [
      {
        label: "先向刘顺才解释并安抚",
        to: "S04",
        effects: { stats: { virtue: 1, resentment: -1 }, flags: { paperMoneyReversed: true } }
      },
      {
        label: "登记纸扎售后投诉",
        to: "S04",
        effects: { stats: { kpi: 1, resentment: 1 }, flags: { paperMoneyReversed: true } }
      }
    ]
  },
  {
    id: "neighbor-knock",
    title: "邻居敲门借酱油",
    body: [
      "灵堂门刚开，隔壁邻居端着空碗来借酱油。刘顺才正好站在门口，阴风把门帘吹得直往上翻。",
      "生活气息与灵异现场撞在一起，你得先把异常藏住。"
    ],
    choices: [
      {
        label: "用障眼法压住阴风",
        meta: "需要术法：障眼法。",
        requires: { spell: "concealment" },
        successTo: "S04",
        failTo: "S04",
        successEffects: { stats: { exposure: -1 }, flags: { neighborKnock: true } },
        failEffects: { stats: { exposure: 1 }, flags: { neighborKnock: true } }
      },
      {
        label: "装成老楼穿堂风",
        to: "S04",
        effects: { stats: { exposure: 1 }, flags: { neighborKnock: true } }
      }
    ]
  },
  {
    id: "incense-out",
    title: "香突然灭了",
    body: [
      "灵堂上的三炷香同时熄灭。刘顺才的魂影跟着暗了一层，屋里的争吵声却更刺耳。",
      "这是礼仪中断，也是怨念开始波动的征兆。"
    ],
    choices: [
      {
        label: "按入职礼仪重新续香",
        meta: "需要通礼 1。",
        requires: { stat: "etiquette", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: { stats: { resentment: -1 }, flags: { incenseOut: true } },
        failEffects: { stats: { resentment: 1 }, flags: { incenseOut: true } }
      },
      {
        label: "冒险拨动打火机",
        to: "S04",
        effects: { stats: { exposure: 1 }, flags: { incenseOut: true } }
      }
    ]
  },
  {
    id: "paper-phone-scam",
    title: "纸扎手机诈骗电话",
    body: [
      "一只还没烧透的纸扎手机响了。对面自称阴间反诈中心，说刘顺才有一笔高额功德需要付费解冻。",
      "刘顺才很认真地问你：地府客服也会主动来电？"
    ],
    choices: [
      {
        label: "立刻挂断并记下号码",
        to: "S04",
        effects: { stats: { virtue: 1 }, flags: { scamInfo: true } }
      },
      {
        label: "花一枚冥币套取诈骗话术",
        requires: { inventory: "money", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: { inventory: { money: -1 }, stats: { kpi: 1 }, flags: { scamInfo: true } },
        failEffects: { stats: { kpi: -1 } }
      }
    ]
  },
  {
    id: "doudou-drawing",
    title: "豆豆画了你的画像",
    body: [
      "豆豆趴在茶几上画画。纸上除了遗像、旧座钟和家里人，还多了一个脚不沾地、胸前挂工牌的人。",
      "他抬头看了你一眼，又给画像补上了眼睛。"
    ],
    choices: [
      {
        label: "让他保留这张画",
        to: "S04",
        effects: {
          stats: { exposure: 1, virtue: 1 },
          relations: { doudou: 1 },
          flags: { doudouDrawing: true, doudouRemembers: true }
        }
      },
      {
        label: "用工牌让他忽略画像",
        requires: { inventory: "badge", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: { inventory: { badge: -1 }, stats: { exposure: -1 }, flags: { doudouDrawing: true } },
        failEffects: { stats: { exposure: 1 }, flags: { doudouRemembers: true } }
      }
    ]
  },
  {
    id: "baiqi-fake-rule",
    title: "白七发来一条“新规则”",
    body: [
      "白七给你发来消息：最新规定，头七任务必须先让亡魂填十八页满意度问卷，否则不算接案。",
      "消息末尾还有一行小字：转发三个新鬼差可免一页。"
    ],
    choices: [
      {
        label: "调用入职手册核对规则",
        requires: { inventory: "handbook", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: {
          inventory: { handbook: -1 },
          abilities: { etiquette: 1 },
          relations: { baiqi: -1 },
          flags: { fakeRule: true, rulesChecked: true }
        },
        failEffects: { stats: { kpi: -1 } }
      },
      {
        label: "照他说的先找问卷",
        to: "S04",
        effects: { stats: { kpi: -1 }, relations: { baiqi: -1 }, flags: { fakeRule: true } }
      }
    ]
  },
  {
    id: "lanfang-cough",
    title: "许兰芳咳嗽加重",
    body: [
      "许兰芳忽然弯下腰，咳得说不出话。药盒就在柜子上，家里人却都在争吵，没有人注意。",
      "你可以干预，但任何阳间动作都会留下痕迹。"
    ],
    choices: [
      {
        label: "用移物术把药盒推到桌边",
        requires: { spell: "moveObject" },
        successTo: "S04",
        failTo: "S04",
        successEffects: { stats: { virtue: 1, exposure: 1 }, flags: { lanfangCough: true } },
        failEffects: { stats: { exposure: 1 }, flags: { lanfangCough: true } }
      },
      {
        label: "让刘顺才提醒豆豆",
        to: "S04",
        effects: { stats: { resentment: 1 }, relations: { doudou: 1 }, flags: { lanfangCough: true } }
      }
    ]
  },
  {
    id: "drawer-conflict",
    title: "刘明远偷偷翻抽屉",
    body: [
      "刘明远趁人不注意拉开旧柜抽屉。刘明溪正好回头，屋里的火药味一下盖过了香火味。",
      "刘顺才的魂影开始发抖，家属矛盾正在抬高怨念。"
    ],
    choices: [
      {
        label: "用话术诱导他主动解释",
        meta: "需要话术 1。",
        requires: { stat: "speech", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: { stats: { resentment: -1 }, flags: { drawerConflict: true } },
        failEffects: { stats: { resentment: 1 }, flags: { drawerConflict: true, houseConflict: true } }
      },
      {
        label: "先记下矛盾，继续观察",
        to: "S04",
        effects: { stats: { resentment: 1 }, flags: { drawerConflict: true, houseConflict: true } }
      }
    ]
  },
  {
    id: "clock-chime",
    title: "旧座钟短暂复响",
    body: [
      "停了多年的旧座钟忽然响了一声，指针从 7 点 17 分抖到 7 点 20，又退了回去。",
      "刘顺才下意识望向许兰芳。这个异常显然与他的执念有关。"
    ],
    choices: [
      {
        label: "沿着情绪反应追查座钟",
        to: "S04",
        effects: { stats: { virtue: 1 }, flags: { clockImportant: true, knownRing: true } }
      },
      {
        label: "先把异常写进派工单",
        to: "S04",
        effects: { stats: { kpi: 1 }, flags: { clockAbnormal: true } }
      }
    ]
  },
  {
    id: "station-inspection",
    title: "马面站长抽查定位",
    body: [
      "工牌突然震动：驿站正在抽查外勤定位。系统显示你比派工单预计时间早到了十二分钟。",
      "早到不违规，但地府考勤系统似乎对一切正常情况都抱有怀疑。"
    ],
    choices: [
      {
        label: "如实提交现场定位",
        to: "S04",
        effects: { stats: { kpi: 1 }, flags: { stationInspection: true } }
      },
      {
        label: "用话术补一份漂亮说明",
        requires: { stat: "speech", gte: 1 },
        successTo: "S04",
        failTo: "S04",
        successEffects: { stats: { kpi: 1 }, flags: { stationInspection: true } },
        failEffects: { stats: { kpi: -1 }, flags: { stationInspection: true, auditRisk: true } }
      }
    ]
  }
];

let state = loadFreshState();

const el = {
  sceneTag: document.getElementById("sceneTag"),
  casePhase: document.getElementById("casePhase"),
  chapterLabel: document.getElementById("chapterLabel"),
  sceneTitle: document.getElementById("sceneTitle"),
  storyText: document.getElementById("storyText"),
  choices: document.getElementById("choices"),
  stats: document.getElementById("stats"),
  abilities: document.getElementById("abilities"),
  caseRisks: document.getElementById("caseRisks"),
  incident: document.getElementById("incident"),
  inventory: document.getElementById("inventory"),
  spells: document.getElementById("spells"),
  flags: document.getElementById("flags"),
  historyLog: document.getElementById("historyLog"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  undoBtn: document.getElementById("undoBtn"),
  restartBtn: document.getElementById("restartBtn")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] || 1;
  }
  return ((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0) || 1;
}

function loadFreshState() {
  const fresh = clone(START_STATE);
  fresh.case.random.seed = createSeed();
  return fresh;
}

function mergeDefaults(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      target[key] = clone(value);
      return;
    }
    if (value && typeof value === "object") {
      if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
        target[key] = {};
      }
      mergeDefaults(target[key], value);
      return;
    }
    target[key] = value;
  });
  return target;
}

function hydrateState(raw) {
  if (!raw || typeof raw !== "object") return loadFreshState();
  if (raw.schemaVersion !== 2) return migrateLegacyState(raw);

  const hydrated = clone(START_STATE);
  mergeDefaults(hydrated, raw);
  hydrated.schemaVersion = 2;
  hydrated.case.random.seed = hydrated.case.random.seed || createSeed();
  hydrated.undo = Array.isArray(raw.undo) ? raw.undo.slice(-20) : [];
  return hydrated;
}

function migrateLegacyState(legacy) {
  const migrated = loadFreshState();
  const oldStats = legacy.stats || {};
  const oldInventory = legacy.inventory || {};

  migrated.current = SCENES[legacy.current] || legacy.current === "RX" ? legacy.current : "S00";
  migrated.profile.routes.virtue = Number(oldStats.virtue) || 0;
  migrated.profile.routes.kpi = Number(oldStats.kpi) || 0;
  migrated.profile.routes.attachment = Number(oldStats.attachment) || 0;
  migrated.profile.abilities.speech = Math.max(0, Number(oldStats.speech) || 0);
  migrated.profile.abilities.soul = Math.max(0, Number(oldStats.pressure) || 0);
  migrated.profile.spells.concealment = migrated.profile.abilities.speech > 0;
  migrated.profile.spells.dream = migrated.profile.routes.virtue > 0;
  migrated.profile.spells.soulLock = migrated.profile.abilities.soul > 0;
  migrated.case.risks.exposure = Math.max(0, Number(oldStats.exposure) || 0);
  migrated.case.risks.resentment = Math.max(0, Number(oldStats.resentment) || 0);

  Object.keys(migrated.profile.inventory).forEach((key) => {
    if (Number.isFinite(Number(oldInventory[key]))) {
      migrated.profile.inventory[key] = Math.max(0, Number(oldInventory[key]));
    }
  });
  migrated.profile.inventory.badge = 1;
  migrated.profile.inventory.handbook = 1;
  migrated.case.usages.badge = Number(oldInventory.badge) === 0;
  migrated.case.flags = clone(legacy.flags || {});
  migrated.history = Array.isArray(legacy.history) ? legacy.history.slice(0, 12) : migrated.history;

  const inCase = /^(S0[4-9]|S1[0-4]|E0[1-5])$/.test(migrated.current);
  if (inCase && !migrated.current.startsWith("E")) {
    migrated.case.started = true;
    migrated.case.loadout.preset = "旧版存档迁移";
    migrated.case.loadout.money = Math.min(5, migrated.profile.inventory.money);
    migrated.profile.inventory.money -= migrated.case.loadout.money;
    ["soup", "spring", "handkerchief", "bottle"].forEach((key) => {
      migrated.case.loadout.consumables[key] = migrated.profile.inventory[key];
      migrated.profile.inventory[key] = 0;
    });
    migrated.case.random.incidentId = INCIDENTS[migrated.case.random.seed % INCIDENTS.length].id;
    migrated.case.random.resolved = true;
  }

  if (migrated.current.startsWith("E") && legacy.flags?.[`rewarded_${migrated.current}`]) {
    migrated.case.rewardedEnding = migrated.current;
  }
  clampState(migrated);
  return migrated;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampState(target = state) {
  Object.keys(target.profile.abilities).forEach((key) => {
    target.profile.abilities[key] = Math.max(0, Number(target.profile.abilities[key]) || 0);
  });
  Object.keys(target.profile.inventory).forEach((key) => {
    target.profile.inventory[key] = Math.max(0, Number(target.profile.inventory[key]) || 0);
  });
  target.profile.inventory.money = clamp(target.profile.inventory.money, 0, 5);
  Object.keys(target.profile.relations).forEach((key) => {
    target.profile.relations[key] = clamp(target.profile.relations[key], -3, 3);
  });
  target.case.risks.exposure = clamp(target.case.risks.exposure, 0, 4);
  target.case.risks.resentment = clamp(target.case.risks.resentment, 0, 4);
  target.case.loadout.money = clamp(target.case.loadout.money, 0, 5);
  Object.keys(target.case.loadout.consumables).forEach((key) => {
    target.case.loadout.consumables[key] = Math.max(
      0,
      Number(target.case.loadout.consumables[key]) || 0
    );
  });
}

function getStat(key) {
  if (["virtue", "kpi", "attachment"].includes(key)) {
    return state.profile.routes[key] || 0;
  }
  if (key === "exposure" || key === "resentment") return state.case.risks[key] || 0;
  if (key === "pressure" || key === "soul") return state.profile.abilities.soul || 0;
  if (key === "speech" || key === "etiquette") return state.profile.abilities[key] || 0;
  return 0;
}

function addStat(key, delta) {
  if (["virtue", "kpi", "attachment"].includes(key)) {
    state.profile.routes[key] = (state.profile.routes[key] || 0) + delta;
  } else if (key === "exposure" || key === "resentment") {
    state.case.risks[key] = (state.case.risks[key] || 0) + delta;
  } else if (key === "pressure" || key === "soul") {
    state.profile.abilities.soul = (state.profile.abilities.soul || 0) + delta;
  } else if (key === "speech" || key === "etiquette") {
    state.profile.abilities[key] = (state.profile.abilities[key] || 0) + delta;
  }
}

function getInventory(key) {
  if (key === "badge" || key === "handbook") {
    return state.case.usages[key] ? 0 : state.profile.inventory[key] || 0;
  }
  if (key === "money" && state.case.started) return state.case.loadout.money;
  if (key in state.case.loadout.consumables && state.case.started) {
    return state.case.loadout.consumables[key] || 0;
  }
  return state.profile.inventory[key] || 0;
}

function addInventory(key, delta) {
  if (key === "badge" || key === "handbook") {
    if (delta < 0) state.case.usages[key] = true;
    if (delta > 0) state.profile.inventory[key] = (state.profile.inventory[key] || 0) + delta;
    return;
  }
  if (key === "money" && state.case.started) {
    state.case.loadout.money += delta;
    return;
  }
  if (key in state.case.loadout.consumables && state.case.started) {
    state.case.loadout.consumables[key] += delta;
    return;
  }
  state.profile.inventory[key] = (state.profile.inventory[key] || 0) + delta;
}

function getFlag(key) {
  return Boolean(state.case.flags[key] || state.profile.flags[key]);
}

function setFlag(key, value) {
  state.case.flags[key] = value;
}

function addHistory(text) {
  if (!text) return;
  state.history.unshift(text);
  state.history = state.history.slice(0, 12);
}

function applyEffects(effects) {
  if (!effects) return;

  Object.entries(effects.stats || {}).forEach(([key, delta]) => addStat(key, delta));
  Object.entries(effects.abilities || {}).forEach(([key, delta]) => addStat(key, delta));
  Object.entries(effects.inventory || {}).forEach(([key, delta]) => addInventory(key, delta));
  Object.entries(effects.flags || {}).forEach(([key, value]) => setFlag(key, value));
  Object.entries(effects.spells || {}).forEach(([key, value]) => {
    state.profile.spells[key] = Boolean(value);
  });
  Object.entries(effects.relations || {}).forEach(([key, delta]) => {
    state.profile.relations[key] = (state.profile.relations[key] || 0) + delta;
  });
  clampState();
}

function configureLoadout(preset = "standard") {
  if (state.case.started) return;

  state.case.started = true;
  state.case.phase = "接案";
  state.case.loadout.preset = preset === "light" ? "轻装出勤" : "标准配置";
  const money = Math.min(5, state.profile.inventory.money || 0);
  state.case.loadout.money = money;
  state.profile.inventory.money -= money;

  if (preset !== "light" && state.profile.inventory.soup > 0) {
    state.profile.inventory.soup -= 1;
    state.case.loadout.consumables.soup += 1;
  }

  if (!state.case.random.incidentId) {
    const incident = INCIDENTS[state.case.random.seed % INCIDENTS.length];
    state.case.random.incidentId = incident.id;
  }
  addHistory(`已接案：${state.case.name}（${state.case.loadout.preset}）。`);
  clampState();
}

function returnLoadout() {
  if (!state.case.started) return;
  state.profile.inventory.money = Math.min(
    5,
    state.profile.inventory.money + state.case.loadout.money
  );
  state.case.loadout.money = 0;
  Object.keys(state.case.loadout.consumables).forEach((key) => {
    state.profile.inventory[key] =
      (state.profile.inventory[key] || 0) + state.case.loadout.consumables[key];
    state.case.loadout.consumables[key] = 0;
  });
  state.case.started = false;
}

function checkRequirement(requirement) {
  if (!requirement) return true;
  if (requirement.any) return requirement.any.some(checkRequirement);
  if (requirement.all) return requirement.all.every(checkRequirement);
  if (requirement.stat) return getStat(requirement.stat) >= requirement.gte;
  if (requirement.inventory) return getInventory(requirement.inventory) >= requirement.gte;
  if (requirement.flag) return getFlag(requirement.flag);
  if (requirement.spell) return Boolean(state.profile.spells[requirement.spell]);
  if (requirement.relation) {
    return (state.profile.relations[requirement.relation] || 0) >= requirement.gte;
  }
  return true;
}

function requirementText(requirement) {
  if (!requirement) return "";
  if (requirement.any) {
    return `需要 ${requirement.any.map(requirementText).join(" 或 ").replaceAll("需要 ", "")}`;
  }
  if (requirement.all) {
    return `需要 ${requirement.all.map(requirementText).join(" 且 ").replaceAll("需要 ", "")}`;
  }
  if (requirement.stat) {
    return `需要 ${STAT_LABELS[requirement.stat] || ABILITY_LABELS[requirement.stat] || requirement.stat} ${requirement.gte}`;
  }
  if (requirement.inventory) {
    return `需要 ${INVENTORY_LABELS[requirement.inventory] || requirement.inventory} ${requirement.gte}`;
  }
  if (requirement.flag) return `需要线索：${FLAG_LABELS[requirement.flag] || requirement.flag}`;
  if (requirement.spell) return `需要术法：${SPELL_LABELS[requirement.spell] || requirement.spell}`;
  if (requirement.relation) return `需要关系：${requirement.relation} ${requirement.gte}`;
  return "";
}

function choiceLabel(choice) {
  return choice.label.replace(/\s+/g, " ").trim();
}

function snapshotForUndo() {
  const snapshot = clone(state);
  snapshot.undo = [];
  return snapshot;
}

function recordSetback(choice) {
  if (!state.case.started) return;
  const stats = choice.failEffects?.stats || {};
  let type = "判定失手";
  if ((stats.exposure || 0) > 0) type = "阳间目击";
  else if ((stats.resentment || 0) > 0) type = "怨念反噬";
  else if ((stats.kpi || 0) < 0) type = "流程失误";
  else if (choice.requires?.inventory) type = "资源短缺";

  state.case.injuries.push({
    scene: state.current,
    choice: choiceLabel(choice),
    type
  });
  state.case.injuries = state.case.injuries.slice(-8);
}

function completeTransition(origin, target) {
  if (origin === "RX") state.case.random.resolved = true;
  state.current = target || state.current;
  render();
}

function handleChoice(choice) {
  state.undo.push(snapshotForUndo());
  state.undo = state.undo.slice(-20);

  const origin = state.current;
  const label = choiceLabel(choice);

  if (choice.resolve) {
    const result = choice.resolve(state) || {};
    applyEffects(choice.effects);
    applyEffects(result.effects);
    if (choice.loadout) configureLoadout(choice.loadout);
    addHistory(result.log || `选择：${label}`);
    completeTransition(origin, result.to || choice.to);
    return;
  }

  const passed = checkRequirement(choice.requires);
  if (choice.requires && !passed) {
    applyEffects(choice.failEffects);
    recordSetback(choice);
    if (choice.loadout) configureLoadout(choice.loadout);
    addHistory(choice.failLog || `判定失败，带着代价继续：${label}`);
    completeTransition(origin, choice.failTo || choice.to);
    return;
  }

  applyEffects(choice.effects);
  applyEffects(choice.successEffects);
  if (choice.loadout) configureLoadout(choice.loadout);
  addHistory(choice.successLog || `选择：${label}`);
  completeTransition(origin, choice.successTo || choice.to);
}

function resolveEnding() {
  if (getFlag("memoryGap")) return "E05";
  if (
    getStat("exposure") >= 3 ||
    getStat("resentment") >= 4 ||
    state.case.injuries.length >= 3
  ) {
    return "E04";
  }
  if (getStat("kpi") >= 3 && getStat("virtue") <= 1) return "E02";
  return "E01";
}

function promoteCaseOutcome(endingId) {
  if (getFlag("doudouRemembers") || getFlag("doudouDrawing")) {
    state.profile.flags.doudouConnection = true;
  }
  if (getFlag("baiqiCoop") || getFlag("baiqiTrust")) {
    state.profile.flags.baiqiAlliance = true;
    state.profile.relations.baiqi += 1;
  }
  if (getFlag("baiqiGrudge") || getFlag("baiqiSteal")) {
    state.profile.flags.baiqiConflict = true;
    state.profile.relations.baiqi -= 1;
  }
  if (getFlag("auditRisk") || endingId === "E03" || endingId === "E04") {
    state.profile.flags.auditRisk = true;
  }
  if (getFlag("memoryGap")) state.profile.flags.memoryGap = true;
  if (endingId === "E01") state.profile.flags.liuFamilyVisit = true;
  if (endingId === "E04") state.profile.flags.trialWatch = true;
  clampState();
}

function effectSummary(reward) {
  const parts = [];
  Object.entries(reward?.stats || {}).forEach(([key, delta]) => {
    const label = STAT_LABELS[key] || key;
    parts.push(`${label} ${delta >= 0 ? "+" : ""}${delta}`);
  });
  Object.entries(reward?.inventory || {}).forEach(([key, delta]) => {
    if (delta > 0) parts.push(`获得${INVENTORY_LABELS[key] || key} ×${delta}`);
  });
  return parts;
}

function riskLabel(key, value = getStat(key)) {
  const labels =
    key === "exposure"
      ? ["隐匿", "异样", "可疑", "目击", "失控"]
      : ["平静", "波动", "执拗", "危险", "暴走"];
  return labels[clamp(value, 0, 4)];
}

function buildSettlement(endingId, scene) {
  const incident = INCIDENTS.find((item) => item.id === state.case.random.incidentId);
  const audit =
    state.profile.flags.auditRisk || getStat("exposure") >= 3
      ? "重点关注"
      : state.case.injuries.length >= 2
        ? "抽查"
        : "正常";
  const futures = [];
  if (state.profile.flags.liuFamilyVisit) futures.push("刘家清明回访");
  if (state.profile.flags.doudouConnection) futures.push("看得见你的小孩");
  if (state.profile.flags.memoryGap) futures.push("刘顺才梦境碎片回访");
  if (state.profile.flags.auditRisk) futures.push("地府审计关注");
  if (state.profile.flags.trialWatch) futures.push("试用期事故说明");
  if (state.profile.flags.baiqiConflict) futures.push("白七后续冲突");

  return {
    endingId,
    title: scene.title,
    baseResult: endingId === "E04" ? "任务失控后强制收束" : "亡魂已完成接引",
    routes: {
      kpi: getStat("kpi"),
      virtue: getStat("virtue"),
      attachment: getStat("attachment")
    },
    risks: {
      exposure: `${getStat("exposure")} · ${riskLabel("exposure")}`,
      resentment: `${getStat("resentment")} · ${riskLabel("resentment")}`
    },
    audit,
    incident: incident?.title || "无",
    injuries: clone(state.case.injuries),
    rewards: effectSummary(scene.reward),
    futures
  };
}

function applyEndingReward(scene) {
  if (!scene.ending) return;
  state.case.phase = "返回驿站";

  if (state.case.rewardedEnding === state.current) {
    if (!state.case.settlement) state.case.settlement = buildSettlement(state.current, scene);
    return;
  }

  returnLoadout();
  applyEffects(scene.reward);
  promoteCaseOutcome(state.current);
  state.case.rewardedEnding = state.current;
  state.case.settlement = buildSettlement(state.current, scene);

  if (!state.profile.completedCases.includes(state.case.id)) {
    state.profile.completedCases.push(state.case.id);
  }
  state.profile.caseHistory.push(clone(state.case.settlement));
  state.profile.caseHistory = state.profile.caseHistory.slice(-10);
  addHistory(`案件结算：${scene.title}。`);
}

function phaseForScene(sceneId) {
  if (/^S0[0-2]$/.test(sceneId)) return "入职";
  if (["S03", "S03L", "RX"].includes(sceneId)) return "接案";
  if (/^S0[4-9]$/.test(sceneId) || sceneId === "S10") return "调查";
  if (["S11", "S12"].includes(sceneId)) return "执行";
  if (sceneId === "S13") return "危机";
  if (sceneId === "S14") return "结算";
  if (/^E0[1-5]$/.test(sceneId)) return "返回驿站";
  return state.case.phase;
}

function getCurrentScene() {
  if (state.current !== "RX") return SCENES[state.current];
  const incident = INCIDENTS.find((item) => item.id === state.case.random.incidentId);
  if (!incident) return null;
  return {
    chapter: "本案随机插曲",
    title: incident.title,
    body: incident.body,
    choices: incident.choices
  };
}

function prepareCurrentScene() {
  if ((state.current === "S04" || state.current === "RX") && !state.case.started) {
    configureLoadout("standard");
  }
  state.case.phase = phaseForScene(state.current);
}

function render() {
  prepareCurrentScene();
  const scene = getCurrentScene();
  if (!scene) {
    state.current = "S00";
    state.case.phase = "入职";
    render();
    return;
  }

  applyEndingReward(scene);

  el.sceneTag.textContent = state.current;
  el.casePhase.textContent = state.case.phase;
  el.chapterLabel.textContent = scene.chapter || "试玩单元 01";
  el.sceneTitle.textContent = scene.title;

  el.storyText.innerHTML = "";
  scene.body.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    el.storyText.appendChild(p);
  });
  if (scene.ending && state.case.settlement) renderSettlement(state.case.settlement);

  el.choices.innerHTML = "";
  if (scene.ending) {
    const summary = document.createElement("button");
    summary.className = "choice-button primary";
    summary.type = "button";
    summary.innerHTML = `<span class="choice-title">重新开始</span><span class="choice-meta">开始新一轮会生成新的案件随机种子；当前结局仍可保存。</span>`;
    summary.addEventListener("click", restartGame);
    el.choices.appendChild(summary);
  } else {
    scene.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-button${choice.primary ? " primary" : ""}`;

      const req = requirementText(choice.requires);
      const meta = [choice.meta, req].filter(Boolean).join(" · ");
      const title = document.createElement("span");
      title.className = "choice-title";
      title.textContent = choice.label;

      const sub = document.createElement("span");
      sub.className = "choice-meta";
      sub.textContent = meta || "继续";

      button.append(title, sub);
      button.addEventListener("click", () => handleChoice(choice));
      el.choices.appendChild(button);
    });
  }

  renderProfile();
  renderCase();
  renderInventory();
  renderSpells();
  renderFlags();
  renderHistory();
  el.undoBtn.disabled = state.undo.length === 0;
  document.title = `${scene.title} | 你死了，还要上班`;
}

function renderProfile() {
  el.stats.innerHTML = "";
  [
    ["virtue", "阴德"],
    ["kpi", "KPI"],
    ["attachment", "人间牵挂"]
  ].forEach(([key, label]) => {
    const item = document.createElement("div");
    item.className = "stat-item";
    item.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value">${getStat(key)}</span>`;
    el.stats.appendChild(item);
  });

  el.abilities.innerHTML = "";
  Object.entries(ABILITY_LABELS).forEach(([key, label]) => {
    const value = getStat(key);
    const level = value >= 2 ? "精通" : value >= 1 ? "熟练" : "生疏";
    const item = document.createElement("div");
    item.className = "ability-item";
    item.innerHTML = `<span>${label}</span><strong>${level} · ${value}</strong>`;
    el.abilities.appendChild(item);
  });
}

function renderCase() {
  el.caseRisks.innerHTML = "";
  [
    ["exposure", "曝光"],
    ["resentment", "怨念"]
  ].forEach(([key, label]) => {
    const value = getStat(key);
    const item = document.createElement("div");
    item.className = "risk-item";
    item.innerHTML = `
      <div class="risk-heading"><span>${label}</span><strong>${riskLabel(key, value)}</strong></div>
      <div class="risk-track"><span style="width:${(value / 4) * 100}%"></span></div>
      <small>${value} / 4</small>`;
    el.caseRisks.appendChild(item);
  });

  const incident = INCIDENTS.find((item) => item.id === state.case.random.incidentId);
  const injuryText = state.case.injuries.length ? ` · 代价 ${state.case.injuries.length}` : "";
  el.incident.textContent = incident
    ? `插曲：${incident.title}${state.case.random.resolved ? "（已处理）" : "（待处理）"}${injuryText}`
    : `尚未接案${injuryText}`;
}

function appendInventoryRow(label, value) {
  const item = document.createElement("div");
  item.className = "inventory-item";
  item.innerHTML = `<span class="inventory-name">${label}</span><span class="inventory-count">${value}</span>`;
  el.inventory.appendChild(item);
}

function renderInventory() {
  el.inventory.innerHTML = "";
  appendInventoryRow("临时鬼差工牌", getInventory("badge") ? "可用" : "本案已用");
  appendInventoryRow("入职手册", getInventory("handbook") ? "可查" : "本案已查");

  if (state.case.started) {
    appendInventoryRow("配置", state.case.loadout.preset);
    appendInventoryRow("法器 / 纪念物", state.case.loadout.artifact || "空槽");
    const carried = Object.entries(state.case.loadout.consumables).filter(([, count]) => count > 0);
    if (carried.length === 0) appendInventoryRow("消耗品", "空槽 ×2");
    carried.forEach(([key, count]) => appendInventoryRow(INVENTORY_LABELS[key], count));
    appendInventoryRow("冥币钱包", `${state.case.loadout.money} / 5`);
    return;
  }

  Object.entries(state.profile.inventory).forEach(([key, count]) => {
    if (["badge", "handbook"].includes(key) || count <= 0) return;
    appendInventoryRow(INVENTORY_LABELS[key] || key, count);
  });
}

function renderSpells() {
  el.spells.innerHTML = "";
  Object.entries(SPELL_LABELS).forEach(([key, label]) => {
    const unlocked = state.profile.spells[key];
    const item = document.createElement("span");
    item.className = `spell-item${unlocked ? " unlocked" : ""}`;
    item.textContent = `${label} · ${unlocked ? "已解锁" : "未解锁"}`;
    el.spells.appendChild(item);
  });
}

function renderFlags() {
  el.flags.innerHTML = "";
  const combined = { ...state.profile.flags, ...state.case.flags };
  const visibleFlags = Object.keys(combined).filter(
    (key) => combined[key] && !HIDDEN_FLAG_KEYS.has(key)
  );

  visibleFlags.slice(0, 10).forEach((key) => {
    const item = document.createElement("div");
    item.className = "flag-item";
    item.textContent = FLAG_LABELS[key] || key;
    el.flags.appendChild(item);
  });

  if (el.flags.children.length === 0) {
    const empty = document.createElement("span");
    empty.className = "flag-empty";
    empty.textContent = "暂无";
    el.flags.appendChild(empty);
  }
}

function renderSettlement(settlement) {
  const card = document.createElement("section");
  card.className = "settlement-card";
  const injuryRows = settlement.injuries.length
    ? settlement.injuries.map((item) => `<li>${item.type}：${item.choice}</li>`).join("")
    : "<li>无判定代价</li>";
  const futureRows = settlement.futures.length
    ? settlement.futures.map((item) => `<li>${item}</li>`).join("")
    : "<li>暂无新增长期后果</li>";
  const rewardRows = settlement.rewards.length
    ? settlement.rewards.map((item) => `<li>${item}</li>`).join("")
    : "<li>无额外奖励</li>";

  card.innerHTML = `
    <p class="settlement-kicker">复合结算单</p>
    <h3>${settlement.title}</h3>
    <dl>
      <div><dt>基础结果</dt><dd>${settlement.baseResult}</dd></div>
      <div><dt>KPI / 阴德 / 牵挂</dt><dd>${settlement.routes.kpi} / ${settlement.routes.virtue} / ${settlement.routes.attachment}</dd></div>
      <div><dt>曝光 / 怨念</dt><dd>${settlement.risks.exposure} / ${settlement.risks.resentment}</dd></div>
      <div><dt>审计</dt><dd>${settlement.audit}</dd></div>
      <div><dt>本案插曲</dt><dd>${settlement.incident}</dd></div>
    </dl>
    <div class="settlement-columns">
      <div><h4>结局奖励</h4><ul>${rewardRows}</ul></div>
      <div><h4>失败代价</h4><ul>${injuryRows}</ul></div>
      <div><h4>长期后果</h4><ul>${futureRows}</ul></div>
    </div>`;
  el.storyText.appendChild(card);
}

function renderHistory() {
  el.historyLog.innerHTML = "";
  state.history.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    el.historyLog.appendChild(li);
  });
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  showToast("已保存：长期档案、案件状态与随机种子。 ");
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
  if (!raw) {
    showToast("没有可读取的存档。");
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const migrated = parsed.schemaVersion !== 2;
    state = hydrateState(parsed);
    clampState();
    showToast(migrated ? "已读取并升级 V0.1 存档。" : "已读取存档，随机插曲保持不变。");
    render();
  } catch {
    showToast("存档损坏，读取失败。");
  }
}

function undoStep() {
  const stack = state.undo;
  const previous = stack.pop();
  if (!previous) return;
  state = hydrateState(previous);
  state.undo = stack;
  render();
}

function restartGame() {
  state = loadFreshState();
  render();
}

let toastTimer = null;
function showToast(text) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.appendChild(toast);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2200);
}

el.saveBtn.addEventListener("click", saveGame);
el.loadBtn.addEventListener("click", loadGame);
el.undoBtn.addEventListener("click", undoStep);
el.restartBtn.addEventListener("click", restartGame);

render();
