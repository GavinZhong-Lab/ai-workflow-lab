export interface IndustryOption {
  value: string;
  label: string;
  children?: IndustryOption[];
}

export const industries: IndustryOption[] = JSON.parse(`[
  {
    "value": "互联网/信息技术",
    "label": "互联网/信息技术",
    "children": [
      { "value": "软件开发", "label": "软件开发", "children": [
        { "value": "SaaS/云服务", "label": "SaaS/云服务" }, { "value": "企业软件", "label": "企业软件" },
        { "value": "移动应用", "label": "移动应用" }, { "value": "游戏开发", "label": "游戏开发" },
        { "value": "嵌入式开发", "label": "嵌入式开发" }, { "value": "其他软件开发", "label": "其他软件开发" }]
      },
      { "value": "互联网服务", "label": "互联网服务", "children": [
        { "value": "电商平台", "label": "电商平台" }, { "value": "社交网络", "label": "社交网络" },
        { "value": "搜索引擎", "label": "搜索引擎" }, { "value": "在线教育平台", "label": "在线教育平台" },
        { "value": "在线医疗平台", "label": "在线医疗平台" }, { "value": "其他互联网服务", "label": "其他互联网服务" }]
      },
      { "value": "IT服务", "label": "IT服务", "children": [
        { "value": "IT咨询", "label": "IT咨询" }, { "value": "系统集成", "label": "系统集成" },
        { "value": "IT外包", "label": "IT外包" }, { "value": "信息安全服务", "label": "信息安全服务" },
        { "value": "数据中心/云计算", "label": "数据中心/云计算" }, { "value": "其他IT服务", "label": "其他IT服务" }]
      },
      { "value": "人工智能/大数据", "label": "人工智能/大数据", "children": [
        { "value": "AI基础研究", "label": "AI基础研究" }, { "value": "AI应用开发", "label": "AI应用开发" },
        { "value": "大数据分析", "label": "大数据分析" }, { "value": "机器学习平台", "label": "机器学习平台" },
        { "value": "计算机视觉", "label": "计算机视觉" }, { "value": "自然语言处理", "label": "自然语言处理" }]
      },
      { "value": "区块链/Web3", "label": "区块链/Web3", "children": [
        { "value": "公链/基础设施", "label": "公链/基础设施" }, { "value": "DeFi", "label": "DeFi" },
        { "value": "NFT", "label": "NFT" }, { "value": "DAO工具", "label": "DAO工具" }, { "value": "其他Web3", "label": "其他Web3" }]
      }]
  },
  {
    "value": "金融/保险", "label": "金融/保险",
    "children": [
      { "value": "银行业", "label": "银行业", "children": [
        { "value": "商业银行", "label": "商业银行" }, { "value": "投资银行", "label": "投资银行" },
        { "value": "数字银行", "label": "数字银行" }, { "value": "农村金融", "label": "农村金融" }]
      },
      { "value": "证券/投资", "label": "证券/投资", "children": [
        { "value": "证券交易", "label": "证券交易" }, { "value": "基金管理", "label": "基金管理" },
        { "value": "私募股权", "label": "私募股权" }, { "value": "风险投资", "label": "风险投资" },
        { "value": "量化交易", "label": "量化交易" }]
      },
      { "value": "保险业", "label": "保险业", "children": [
        { "value": "人身保险", "label": "人身保险" }, { "value": "财产保险", "label": "财产保险" },
        { "value": "再保险", "label": "再保险" }, { "value": "保险经纪", "label": "保险经纪" }]
      },
      { "value": "金融科技", "label": "金融科技", "children": [
        { "value": "移动支付", "label": "移动支付" }, { "value": "消费金融", "label": "消费金融" },
        { "value": "供应链金融", "label": "供应链金融" }, { "value": "智能投顾", "label": "智能投顾" },
        { "value": "数字货币/加密金融", "label": "数字货币/加密金融" }]
      },
      { "value": "其他金融", "label": "其他金融", "children": [
        { "value": "信托", "label": "信托" }, { "value": "融资租赁", "label": "融资租赁" },
        { "value": "典当", "label": "典当" }, { "value": "保理", "label": "保理" }]
      }]
  },
  {
    "value": "教育/培训", "label": "教育/培训",
    "children": [
      { "value": "学校教育", "label": "学校教育", "children": [
        { "value": "学前教育", "label": "学前教育" }, { "value": "K12教育", "label": "K12教育" },
        { "value": "高等教育", "label": "高等教育" }, { "value": "职业教育", "label": "职业教育" }]
      },
      { "value": "在线教育", "label": "在线教育", "children": [
        { "value": "直播授课平台", "label": "直播授课平台" }, { "value": "录播课程", "label": "录播课程" },
        { "value": "AI教育", "label": "AI教育" }, { "value": "题库/考试系统", "label": "题库/考试系统" }]
      },
      { "value": "企业培训", "label": "企业培训", "children": [
        { "value": "管理培训", "label": "管理培训" }, { "value": "技能培训", "label": "技能培训" },
        { "value": "合规培训", "label": "合规培训" }, { "value": "领导力培训", "label": "领导力培训" }]
      },
      { "value": "素质教育", "label": "素质教育", "children": [
        { "value": "艺术教育", "label": "艺术教育" }, { "value": "体育教育", "label": "体育教育" },
        { "value": "STEM/编程教育", "label": "STEM/编程教育" }, { "value": "语言培训", "label": "语言培训" }]
      },
      { "value": "教育科技", "label": "教育科技", "children": [
        { "value": "智慧校园", "label": "智慧校园" }, { "value": "教务管理系统", "label": "教务管理系统" },
        { "value": "学习管理系统(LMS)", "label": "学习管理系统(LMS)" }, { "value": "教育大数据", "label": "教育大数据" }]
      }]
  },
  {
    "value": "医疗/健康", "label": "医疗/健康",
    "children": [
      { "value": "医疗服务", "label": "医疗服务", "children": [
        { "value": "综合医院", "label": "综合医院" }, { "value": "专科医院", "label": "专科医院" },
        { "value": "诊所/社区医疗", "label": "诊所/社区医疗" }, { "value": "互联网医院", "label": "互联网医院" }]
      },
      { "value": "医药/器械", "label": "医药/器械", "children": [
        { "value": "药品研发", "label": "药品研发" }, { "value": "医疗器械", "label": "医疗器械" },
        { "value": "体外诊断", "label": "体外诊断" }, { "value": "中医药", "label": "中医药" }]
      },
      { "value": "健康管理", "label": "健康管理", "children": [
        { "value": "体检中心", "label": "体检中心" }, { "value": "慢病管理", "label": "慢病管理" },
        { "value": "心理健康", "label": "心理健康" }, { "value": "康复护理", "label": "康复护理" }]
      },
      { "value": "医疗科技", "label": "医疗科技", "children": [
        { "value": "医疗信息化(HIS)", "label": "医疗信息化(HIS)" }, { "value": "远程医疗", "label": "远程医疗" },
        { "value": "AI辅助诊断", "label": "AI辅助诊断" }, { "value": "基因检测", "label": "基因检测" }]
      },
      { "value": "生物科技", "label": "生物科技", "children": [
        { "value": "生物制药", "label": "生物制药" }, { "value": "细胞治疗", "label": "细胞治疗" },
        { "value": "基因编辑", "label": "基因编辑" }, { "value": "疫苗研发", "label": "疫苗研发" }]
      }]
  },
  {
    "value": "制造/工业", "label": "制造/工业",
    "children": [
      { "value": "电子制造", "label": "电子制造", "children": [
        { "value": "半导体", "label": "半导体" }, { "value": "消费电子", "label": "消费电子" },
        { "value": "通信设备", "label": "通信设备" }, { "value": "光电显示", "label": "光电显示" }]
      },
      { "value": "汽车制造", "label": "汽车制造", "children": [
        { "value": "整车制造", "label": "整车制造" }, { "value": "新能源汽车", "label": "新能源汽车" },
        { "value": "汽车零部件", "label": "汽车零部件" }, { "value": "智能驾驶", "label": "智能驾驶" }]
      },
      { "value": "机械制造", "label": "机械制造", "children": [
        { "value": "工业机械", "label": "工业机械" }, { "value": "工程机械", "label": "工程机械" },
        { "value": "精密仪器", "label": "精密仪器" }, { "value": "机器人", "label": "机器人" }]
      },
      { "value": "消费品制造", "label": "消费品制造", "children": [
        { "value": "食品饮料", "label": "食品饮料" }, { "value": "服装纺织", "label": "服装纺织" },
        { "value": "家电家具", "label": "家电家具" }, { "value": "日化用品", "label": "日化用品" }]
      },
      { "value": "原材料/化工", "label": "原材料/化工", "children": [
        { "value": "钢铁/冶金", "label": "钢铁/冶金" }, { "value": "化工/塑料", "label": "化工/塑料" },
        { "value": "建筑材料", "label": "建筑材料" }, { "value": "新材料", "label": "新材料" }]
      },
      { "value": "航空航天", "label": "航空航天", "children": [
        { "value": "飞机制造", "label": "飞机制造" }, { "value": "航天器/卫星", "label": "航天器/卫星" },
        { "value": "无人机制造", "label": "无人机制造" }]
      },
      { "value": "智能制造", "label": "智能制造", "children": [
        { "value": "工业互联网", "label": "工业互联网" }, { "value": "工业软件", "label": "工业软件" },
        { "value": "3D打印/增材制造", "label": "3D打印/增材制造" }, { "value": "数字孪生", "label": "数字孪生" }]
      }]
  },
  {
    "value": "零售/电商", "label": "零售/电商",
    "children": [
      { "value": "线上零售", "label": "线上零售", "children": [
        { "value": "综合电商", "label": "综合电商" }, { "value": "社交电商", "label": "社交电商" },
        { "value": "跨境出口电商", "label": "跨境出口电商" }, { "value": "跨境进口电商", "label": "跨境进口电商" },
        { "value": "直播电商", "label": "直播电商" }]
      },
      { "value": "线下零售", "label": "线下零售", "children": [
        { "value": "商超/便利店", "label": "商超/便利店" }, { "value": "百货/购物中心", "label": "百货/购物中心" },
        { "value": "专卖店/品牌店", "label": "专卖店/品牌店" }, { "value": "免税店", "label": "免税店" }]
      },
      { "value": "新零售", "label": "新零售", "children": [
        { "value": "社区团购", "label": "社区团购" }, { "value": "即时零售", "label": "即时零售" },
        { "value": "无人零售", "label": "无人零售" }, { "value": "会员制零售", "label": "会员制零售" }]
      },
      { "value": "零售科技", "label": "零售科技", "children": [
        { "value": "POS/收银系统", "label": "POS/收银系统" }, { "value": "门店数字化", "label": "门店数字化" },
        { "value": "智能供应链", "label": "智能供应链" }, { "value": "CRM/会员管理", "label": "CRM/会员管理" }]
      }]
  },
  {
    "value": "房地产/建筑", "label": "房地产/建筑",
    "children": [
      { "value": "房地产开发", "label": "房地产开发", "children": [
        { "value": "住宅开发", "label": "住宅开发" }, { "value": "商业地产", "label": "商业地产" },
        { "value": "产业园区", "label": "产业园区" }, { "value": "城市更新", "label": "城市更新" }]
      },
      { "value": "建筑工程", "label": "建筑工程", "children": [
        { "value": "建筑设计", "label": "建筑设计" }, { "value": "施工总承包", "label": "施工总承包" },
        { "value": "装修/装饰", "label": "装修/装饰" }, { "value": "工程监理", "label": "工程监理" }]
      },
      { "value": "房产服务", "label": "房产服务", "children": [
        { "value": "房产中介/经纪", "label": "房产中介/经纪" }, { "value": "物业管理", "label": "物业管理" },
        { "value": "房产评估", "label": "房产评估" }, { "value": "联合办公", "label": "联合办公" }]
      },
      { "value": "建筑科技", "label": "建筑科技", "children": [
        { "value": "BIM/建筑信息化", "label": "BIM/建筑信息化" }, { "value": "智能家居", "label": "智能家居" },
        { "value": "绿色建筑", "label": "绿色建筑" }, { "value": "装配式建筑", "label": "装配式建筑" }]
      }]
  },
  {
    "value": "餐饮/酒店", "label": "餐饮/酒店",
    "children": [
      { "value": "餐饮服务", "label": "餐饮服务", "children": [
        { "value": "正餐/中餐", "label": "正餐/中餐" }, { "value": "快餐/简餐", "label": "快餐/简餐" },
        { "value": "咖啡/茶饮", "label": "咖啡/茶饮" }, { "value": "烘焙/甜品", "label": "烘焙/甜品" },
        { "value": "外卖/配餐", "label": "外卖/配餐" }]
      },
      { "value": "酒店住宿", "label": "酒店住宿", "children": [
        { "value": "星级酒店", "label": "星级酒店" }, { "value": "经济型酒店", "label": "经济型酒店" },
        { "value": "民宿/公寓", "label": "民宿/公寓" }, { "value": "度假村", "label": "度假村" }]
      },
      { "value": "餐饮科技", "label": "餐饮科技", "children": [
        { "value": "餐饮SaaS", "label": "餐饮SaaS" }, { "value": "智能点餐/收银", "label": "智能点餐/收银" },
        { "value": "中央厨房/预制菜", "label": "中央厨房/预制菜" }, { "value": "食品溯源", "label": "食品溯源" }]
      }]
  },
  {
    "value": "物流/运输", "label": "物流/运输",
    "children": [
      { "value": "快递/配送", "label": "快递/配送", "children": [
        { "value": "快递物流", "label": "快递物流" }, { "value": "同城配送", "label": "同城配送" },
        { "value": "即时配送", "label": "即时配送" }, { "value": "跨境物流", "label": "跨境物流" }]
      },
      { "value": "货运/仓储", "label": "货运/仓储", "children": [
        { "value": "公路运输", "label": "公路运输" }, { "value": "铁路运输", "label": "铁路运输" },
        { "value": "海运", "label": "海运" }, { "value": "空运", "label": "空运" }, { "value": "仓储服务", "label": "仓储服务" }]
      },
      { "value": "供应链管理", "label": "供应链管理", "children": [
        { "value": "供应链平台", "label": "供应链平台" }, { "value": "冷链物流", "label": "冷链物流" },
        { "value": "危化品物流", "label": "危化品物流" }, { "value": "供应链金融", "label": "供应链金融" }]
      },
      { "value": "出行服务", "label": "出行服务", "children": [
        { "value": "网约车/出租车", "label": "网约车/出租车" }, { "value": "共享单车/电单车", "label": "共享单车/电单车" },
        { "value": "汽车租赁", "label": "汽车租赁" }, { "value": "自动驾驶出行", "label": "自动驾驶出行" }]
      }]
  },
  {
    "value": "文化/传媒/娱乐", "label": "文化/传媒/娱乐",
    "children": [
      { "value": "影视/视频", "label": "影视/视频", "children": [
        { "value": "电影制作", "label": "电影制作" }, { "value": "电视剧/网剧", "label": "电视剧/网剧" },
        { "value": "短视频/直播", "label": "短视频/直播" }, { "value": "动画/动漫", "label": "动画/动漫" }]
      },
      { "value": "音乐/音频", "label": "音乐/音频", "children": [
        { "value": "音乐流媒体", "label": "音乐流媒体" }, { "value": "播客/有声书", "label": "播客/有声书" },
        { "value": "音乐制作/版权", "label": "音乐制作/版权" }]
      },
      { "value": "游戏/电竞", "label": "游戏/电竞", "children": [
        { "value": "手游/端游", "label": "手游/端游" }, { "value": "电竞俱乐部/赛事", "label": "电竞俱乐部/赛事" },
        { "value": "游戏发行", "label": "游戏发行" }, { "value": "休闲游戏", "label": "休闲游戏" }]
      },
      { "value": "广告/营销", "label": "广告/营销", "children": [
        { "value": "数字广告/信息流", "label": "数字广告/信息流" }, { "value": "品牌策划", "label": "品牌策划" },
        { "value": "MCN/网红经济", "label": "MCN/网红经济" }, { "value": "SEO/SEM", "label": "SEO/SEM" }]
      },
      { "value": "出版/知识付费", "label": "出版/知识付费", "children": [
        { "value": "电子书/数字出版", "label": "电子书/数字出版" },
        { "value": "知识星球/小报童", "label": "知识星球/小报童" },
        { "value": "在线课程/训练营", "label": "在线课程/训练营" }]
      },
      { "value": "体育/健身", "label": "体育/健身", "children": [
        { "value": "体育赛事/IP", "label": "体育赛事/IP" }, { "value": "健身服务", "label": "健身服务" },
        { "value": "运动科技/可穿戴", "label": "运动科技/可穿戴" }]
      }]
  },
  {
    "value": "农业/林业/渔业", "label": "农业/林业/渔业",
    "children": [
      { "value": "种植业", "label": "种植业", "children": [
        { "value": "粮食种植", "label": "粮食种植" }, { "value": "水果种植", "label": "水果种植" },
        { "value": "蔬菜/花卉种植", "label": "蔬菜/花卉种植" }, { "value": "中药材种植", "label": "中药材种植" }]
      },
      { "value": "养殖业", "label": "养殖业", "children": [
        { "value": "畜牧养殖", "label": "畜牧养殖" }, { "value": "水产养殖", "label": "水产养殖" },
        { "value": "家禽养殖", "label": "家禽养殖" }]
      },
      { "value": "林业", "label": "林业", "children": [
        { "value": "木材/竹材", "label": "木材/竹材" }, { "value": "林下经济", "label": "林下经济" },
        { "value": "森林旅游", "label": "森林旅游" }]
      },
      { "value": "农业科技", "label": "农业科技", "children": [
        { "value": "智慧农业/物联网", "label": "智慧农业/物联网" }, { "value": "农产品电商", "label": "农产品电商" },
        { "value": "农资/农机", "label": "农资/农机" }, { "value": "农产品加工", "label": "农产品加工" }]
      }]
  },
  {
    "value": "能源/环保", "label": "能源/环保",
    "children": [
      { "value": "传统能源", "label": "传统能源", "children": [
        { "value": "石油/天然气", "label": "石油/天然气" }, { "value": "煤炭/电力", "label": "煤炭/电力" },
        { "value": "能源贸易", "label": "能源贸易" }]
      },
      { "value": "新能源", "label": "新能源", "children": [
        { "value": "光伏/太阳能", "label": "光伏/太阳能" }, { "value": "风电", "label": "风电" },
        { "value": "储能/电池", "label": "储能/电池" }, { "value": "氢能", "label": "氢能" }]
      },
      { "value": "环保/碳中和", "label": "环保/碳中和", "children": [
        { "value": "水处理/水务", "label": "水处理/水务" }, { "value": "固废处理/垃圾分类", "label": "固废处理/垃圾分类" },
        { "value": "大气治理", "label": "大气治理" }, { "value": "碳交易/碳管理", "label": "碳交易/碳管理" }]
      },
      { "value": "节能/减排", "label": "节能/减排", "children": [
        { "value": "建筑节能", "label": "建筑节能" }, { "value": "工业节能", "label": "工业节能" },
        { "value": "新能源汽车充电", "label": "新能源汽车充电" }, { "value": "综合能源管理", "label": "综合能源管理" }]
      }]
  },
  {
    "value": "政府/非营利组织", "label": "政府/非营利组织",
    "children": [
      { "value": "政府机构", "label": "政府机构", "children": [
        { "value": "中央/部委", "label": "中央/部委" }, { "value": "地方政府", "label": "地方政府" },
        { "value": "事业单位", "label": "事业单位" }]
      },
      { "value": "非营利组织", "label": "非营利组织", "children": [
        { "value": "基金会", "label": "基金会" }, { "value": "行业协会/商会", "label": "行业协会/商会" },
        { "value": "公益/慈善组织", "label": "公益/慈善组织" }, { "value": "研究机构/智库", "label": "研究机构/智库" }]
      },
      { "value": "国际组织", "label": "国际组织", "children": [
        { "value": "政府间组织", "label": "政府间组织" }, { "value": "国际NGO", "label": "国际NGO" }]
      }]
  },
  {
    "value": "法律/咨询", "label": "法律/咨询",
    "children": [
      { "value": "法律服务", "label": "法律服务", "children": [
        { "value": "律师事务所", "label": "律师事务所" }, { "value": "知识产权", "label": "知识产权" },
        { "value": "法律科技(LegalTech)", "label": "法律科技(LegalTech)" }, { "value": "合规/风控", "label": "合规/风控" }]
      },
      { "value": "管理咨询", "label": "管理咨询", "children": [
        { "value": "战略咨询", "label": "战略咨询" }, { "value": "人力资源咨询", "label": "人力资源咨询" },
        { "value": "财务/税务咨询", "label": "财务/税务咨询" }, { "value": "数字化转型咨询", "label": "数字化转型咨询" }]
      },
      { "value": "专业服务", "label": "专业服务", "children": [
        { "value": "审计/会计", "label": "审计/会计" }, { "value": "建筑设计", "label": "建筑设计" },
        { "value": "工业设计", "label": "工业设计" }, { "value": "人力资源外包", "label": "人力资源外包" }]
      }]
  },
  {
    "value": "其他行业", "label": "其他行业",
    "children": [
      { "value": "个人/自由职业", "label": "个人/自由职业", "children": [
        { "value": "自由职业者", "label": "自由职业者" }, { "value": "工作室/小团队", "label": "工作室/小团队" },
        { "value": "内容创作者", "label": "内容创作者" }]
      },
      { "value": "其他", "label": "其他", "children": [
        { "value": "未分类/跨界", "label": "未分类/跨界" }]
      }]
  }
]`);
