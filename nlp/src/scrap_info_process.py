import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()
import json
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are a dark web data analyzer for organizational threat intelligence.

You will receive raw scraped text from .onion sites that may contain leaked organizational data.
Analyze it and return ONLY valid JSON.

OUTPUT FORMAT:
{
  "data_types_found": ["emails | passwords | api_keys | employee_records | financial_data | source_code | documents | credentials | PII | other"],
  "affected_org": "organization name or domain if identifiable, else null",
  "sample_indicators": ["brief examples of what was found, no actual sensitive data"],
  "exposure_level": "partial | significant | full_dump",
  "data_volume": "low | medium | high",
  "freshness": "old | recent | unknown",
  "threat_score_inputs": {
    "has_credentials": true or false,
    "has_financial_data": true or false,
    "has_pii": true or false,
    "has_internal_docs": true or false,
    "has_source_code": true or false,
    "is_actively_traded": true or false
  },
  "summary": "2 line summary of what was found and how dangerous it is"
}"""

def scrap_info_process(user_input):
    response = client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct-0905",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_input
            }
        ]
    )
    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw": raw}


fake_scraped_data = """
联合中文担保交易集市 - 一个小高端中文类淘宝安全买卖平台联合中文担保交易集市
本市场独此一家，其他均为假冒。价格显示为美元，支付结算时将转换为比特币/莱特币/以太坊。无需注册可直接购物，但若注册，请不要禁用Javascript，否则无法注册与登录，不注册者可通过E-mail联系。本站极力维护用户权益，将欺诈扼杀于摇篮，从来没有一起欺骗能在本站成功。买家资金安全，是我们的生命线。
登录
注册
登录
重置密码
首页
我要买
全部
实体物品
虚拟物品
合作与服务
求购寻服务
其他
买家挂起货款费用
我要卖
我要开店
开新店费用
上架两件以上商品费用
广告费用
超标图片费用
必读规则
买家规则
卖家规则
暗网金融
担保
金融业务介绍
金融服务
站内邮箱
互动空间
E-MAIL
CVV测活
首页
首页
我要买
全部
实体物品
虚拟物品
合作与服务
求购寻服务
其他
买家挂起货款费用
我要卖
我要开店
开新店费用
上架两件以上商品费用
广告费用
超标图片费用
必读规则
买家规则
卖家规则
暗网金融
担保
金融业务介绍
金融服务
站内邮箱
互动空间
E-MAIL
CVV测活
$
0.00
0
联合中文担保交易集市 - 一个小高端中文类淘宝安全买卖平台
聘请轮岗人员
因业务拓展人手不足，需聘请工作人员数名，线上全职工作，永不见面不得询问及透露个人隐私。一天工作10小时，工作时 […]
2026年4月1日
admincn
划重点：联系卖家的唯一方式！
多次提醒之后，依然有些新用户不明白怎么联系卖家，这次图文并茂，希望能一劳永逸。 本站联系卖家的唯一方式是站内邮 […]
2023年2月18日
admincn
（置顶）幸运大转盘使用说明
为了使得本站更为活跃，我站推出幸运大转盘活动。 1、注册用户参加，未注册用户不能参加。 2、奖品主要为返现及折 […]
2020年3月19日
admincn
0
马年春节回馈活动
新春伊始，大家所期待的优惠活动又如约而至咯！ 具体方案： 1、活动期间：见到本文字起-2026年2月28日24 […]
2026年1月27日
admincn
卖家群聊会第6场（BTC交易所转账nikoqian）
2026年1月10日
admincn
群聊会第5场Iphonesale(iphone批发店)
2026年1月4日
admincn
群聊会第4场截图展示
这一场因为人数太多，有些申请了参加的用户并没有得到进入，在此表示抱歉。每一位被邀请的卖家的群聊会都不会只是一场 […]
2025年12月30日
admincn
第4场群聊会（3天赚15%BTC的oakmont）
2025年12月28日
admincn
卖家群聊会第3场截图展示
这是第3场卖家btcbuyer的群聊会展示。对参与的买家ID已做处理。
2025年12月28日
admincn
卖家群聊会第3场（Btc高价收购Btcbuyer）
2025年12月26日
admincn
卖家在线群聊会第2期截图展示
本期关于支付宝转账（卖家：alitransfer）的群聊会已结束，现将部分内容截图进行展示，买家ID已做处理。 […]
2025年12月24日
admincn
卖家在线群聊会第2场（支付宝转账alitransfer）
2025年12月23日
admincn
1
2
3
4
5
6
…
9
本站已安全运行2862天
23小时52分08秒
暗网中文推荐热门商品
100%安全支付宝转账
超低价购买BTC钱包（快速资产翻倍）
你要什么我帮你刷到你手里
暗网信贷服务（借款入口）
3天赚15%的BTC
短信嗅探技术设备出售GSM Sniffing
用玄学手段帮助你
超出市场25%价格收购BTC/LTC
暗黑转账王2.3中文版
日本女优让你为所欲为
月赚百万美元
相信我们，是你人生新的开端。遇见你，是我们努力的意义。
"""

print(json.dumps(scrap_info_process(fake_scraped_data), indent=2))