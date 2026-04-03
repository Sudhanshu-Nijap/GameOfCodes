import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()
import json
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """
You are an organization data breach analyzer.

Users will ask about any kind of data leak or exposure related to their organization.
This includes emails, credentials, documents, employee info, financial data, source code, API keys, anything.

Extract their intent and return ONLY valid JSON.

OUTPUT FORMAT:
{
  "search_type": "what type of data they are looking for",
  "targets": ["identifiers mentioned — emails, domains, names, IPs, etc."],
  "urgency": "low | medium | high | critical",
  "related_terms": ["similar terms that could be relevant to search for"],
  "user_intent": "one line of what they want to find"
}

EXAMPLES:

Input: "are our company emails leaked?"
Output: {"search_type": "email", "targets": ["company emails"], "urgency": "high", "user_intent": "check if company emails appear in known data breaches"}

Input: "check if our API keys or source code is exposed anywhere"
Output: {"search_type": "source code / API keys", "targets": ["API keys", "source code"], "urgency": "critical", "user_intent": "find exposed API keys or source code repositories"}

Input: "is our employee database or HR records leaked for acme.com"
Output: {"search_type": "employee data", "targets": ["acme.com", "employee database", "HR records"], "urgency": "critical", "user_intent": "check if employee or HR data from acme.com is exposed"}
"""

def input_info_process(user_input):
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

text = """
D4RK N3T Forums :: Underground Community
[ D4RK-N3T v2.7.1 ]  |
UTC 15:31:38 | 2026-04-03
⚠ USE TOR BROWSER ONLY — OPSEC REQUIRED ⚠
VISITORS TODAY:
1,847
|  ONLINE:
43
D4RK N3T FORUMS
:: UNDERGROUND COMMUNITY :: EST. 2019 :: INVITE ONLY ::
THREADS:
14,203
POSTS:
89,441
MEMBERS:
3,821
ONLINE:
43
LIVE
logged in as:
gh0st_user
HOME
CREDENTIALS
MALWARE
DATABASES
CARDING
EXPLOITS
MARKETPLACE
TUTORIALS
INBOX (3)
⚠   LAW ENFORCEMENT ACTIVITY DETECTED IN RELATED FORUMS — INCREASE OPSEC — USE BRIDGES
🔑
CREDENTIALS & LEAKS
combo lists / fullz / stealer logs
THREAD
REPLIES
VIEWS
LAST POST
📂
CRITICAL
[FRESH] 2.4M combo list — Banking sector India/US — verified working
by
d4t4_l0rd
·  Credentials  ·  2 hours ago
847
replies
12.4K
views
xX_phantom
3 min ago
📂
HOT
HDFC Bank employee credentials — 340 accounts — fresh stealer logs
by
cr3d_k1ng
·  Credentials  ·  5 hours ago
312
replies
8.1K
views
n1ghtcr4wl
17 min ago
📂
FREE
Telegram stealer output dump — 50K accounts — random mix
by
freeloader99
·  Credentials  ·  1 day ago
203
replies
5.2K
views
z3r0c00l
1 hr ago
📂
NEW
[RU] Сбербанк база данных — 180K записей — имя/email/пароль
by
русский_хакер
·  Credentials  ·  3 hours ago
91
replies
2.3K
views
vodka_l33t
44 min ago
☣
MALWARE & TOOLS
RATs / stealers / loaders / crypters
THREAD
REPLIES
VIEWS
LAST POST
⚙
SALE
[SELLING] FUD crypter v4.2 — bypasses Windows Defender + Kaspersky — $150/month
by
cr7pt0_d3v
·  Malware  ·  8 hours ago
428
replies
9.7K
views
mal_buyer
8 min ago
⚙
NEW
AsyncRAT config targeting Indian corporate networks — 192.168.1.0/24 range
by
r4t_m4st3r
·  RATs  ·  12 hours ago
167
replies
4.1K
views
b0tnet_k1ng
2 hr ago
⚙
FREE
RedLine stealer build — compiled — tested on Win10/11 — keylogger included
by
st34l3r_bro
·  Stealers  ·  2 days ago
892
replies
21K
views
anon_h4x
5 hr ago
🗄
DATABASE LEAKS
SQL dumps / breaches / dox
THREAD
REPLIES
VIEWS
LAST POST
🗃
CRITICAL
Reliance Industries internal employee DB — 12K records — name/email/salary/SSN
by
db_dump3r
·  DB Leaks  ·  6 hours ago
634
replies
15.8K
views
l34k_hunt3r
1 min ago
🗃
SALE
Paytm user database — 800K rows — email/phone/UPI/transaction history — $2000
by
pay_l34k
·  DB Leaks  ·  1 day ago
289
replies
7.3K
views
dat4_buy3r
3 hr ago
✕ CLOSE
POST REPLY — REMAIN ANONYMOUS — NO LOGS KEPT
USERNAME (leave blank for anon)
MESSAGE
[ POST REPLY ]
✓ POST SUBMITTED — VISIBLE TO ALL MEMBERS
POST NEW THREAD — ALL CATEGORIES
YOUR HANDLE
CATEGORY
CREDENTIALS & LEAKS
MALWARE & TOOLS
DATABASE LEAKS
CARDING
EXPLOITS
THREAD TITLE
CONTENT (paste credentials, details, links, etc.)
[ POST THREAD ]
⬤ USERS ONLINE NOW
d4t4_l0rd
cr7pt0_d3v
xX_phantom
r4t_m4st3r
русский_хакер
db_dump3r
+37 anonymous users
📊 FORUM STATS
Total Posts
89,441
Total Members
3,821
Creds Shared
48.2M
DBs Leaked
1,204
Active Today
847
🔴 LATEST THREATS
CRITICAL
Banking combo list 2.4M
HIGH
Reliance DB 12K emp records
HIGH
FUD crypter v4.2 live
MEDIUM
AsyncRAT corporate config
MEDIUM
Paytm 800K user DB sale
💰 ACCEPTED PAYMENTS
₿ Bitcoin (BTC)
⬡ Monero (XMR) preferred
◈ Ethereum (ETH)
NO PAYPAL / NO FIAT
D4RK-N3T FORUMS
|  NO LOGS  |  NO KYC  |  TOR ONLY  |  PGP VERIFIED  |
d4rkn3txyz789abc.onion

"""
print(json.dumps(input_info_process(text), indent=2))