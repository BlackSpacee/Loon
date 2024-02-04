/******************************************
 * @name 摸鱼来啦~
 * @channel https://t.me/yqc_123
 * @feedback https://t.me/yqc_777
 * @version 1.0.1
******************************************
## 更新日志
### 20231023
    处理通知显示不全的问题

## 脚本声明
    1.此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
    2.由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
    3.请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
    4.此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
    5.本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
    6.如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
    7.所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明, 本人保留随时更改或补充此声明的权利, 一旦您使用或复制了此脚本，即视为您已接受此免责声明。

## 使用方法

### 配置 (QuanX)
```properties
[task_local]
6 9 * * * https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/moyu.js, tag=摸鱼来啦, img-url=https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/67/04/ff/6704ff4c-b49b-de91-70ac-201c62d5296f/AppIcon-0-0-1x_U007emarketing-0-0-0-5-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/144x144bb.png, enabled=true
```
### 配置 (Loon)
```properties
[Script]
cron "6 9 * * *" script-path=https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/moyu.js, timeout=10, tag=摸鱼来啦, img-url=https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/67/04/ff/6704ff4c-b49b-de91-70ac-201c62d5296f/AppIcon-0-0-1x_U007emarketing-0-0-0-5-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/144x144bb.png
```
### 配置 (Surge)
```properties
摸鱼来啦 = type=cron,cronexp=0 6 9 * * *,wake-system=1,script-path=https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/moyu.js,timeout=60
```
******************************************/
const scriptName = '摸鱼来啦~'
const $ = new Env(scriptName)
let calendar = {}
loadCalendar()
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth() + 1
const day = today.getDate()
const hour = today.getHours()
const festivalList = [
    { festival: '元宵节', date: lunar2solar(year, 1, 15) },
    { festival: '清明', date: getQinMingJieDate() },
    { festival: '劳动节', date: `${year}/5/1` },
    { festival: '端午节', date: lunar2solar(year, 5, 5) },
    { festival: '中秋节', date: lunar2solar(year, 8, 15) },
    { festival: '国庆节', date: `${year}/10/1` },
    { festival: '元旦', date: `${year + 1}/1/1` },
    { festival: '春节', date: lunar2solar(year + 1, 1, 1) }
]
let holidayList = []
!(async () => {
    await handleFestival()
    await toNotify()
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())
/**
 * 处理节日
 */
function handleFestival() {
    return new Promise(async (resolve) => {
        for (let i = 0; i < festivalList.length; i++) {
            const festival = festivalList[i]
            const date = new Date(festival.date)
            const timestamp = date.getTime().toString().slice(0, 10)
            const remainDays = getRemainDays(timestamp)
            if (remainDays > 0) {
                holidayList.push({ ...festival, diff: remainDays })
            }
        }
        resolve()
    })
}
/**
 * 通知
 */
function toNotify() {
    return new Promise(async (resolve) => {
        let timeFrame = ''
        if (hour < 12) {
            timeFrame = '早'
        } else if (hour < 19) {
            timeFrame = '晌'
        } else {
            timeFrame = '晚'
        }
        let content = `【${month}月${day}日${timeFrame}】`
        content += '\n生活不止眼前的苟且，还有诗和远方，还有摸🐟的快乐。'
        const _almanac = await getPermanentCalendar()
        if (_almanac) {
            content += '\n【今日黄历】'
            content += '\n[农]' + _almanac['lunar']
            content += '\n[势]' + _almanac['lunarGanZhi']
            _almanac['festivals']?.length &&
                (content += '\n[节]' + _almanac['festivals'].map((item) => `【${item}】`).join(''))
            content +=
                '\n[宜]' +
                _almanac['suit'].map((item) => (item?.desc ? `${item.name(item.desc)}` : `${item.name}`)).join(' ')
            content +=
                '\n[忌]' +
                _almanac['avoid'].map((item) => (item?.desc ? `${item.name(item.desc)}` : `${item.name}`)).join(' ')
        }
        const weeekend = getRemainDays(getWeekend())
        content += '\n【快乐周末】'
        if (weeekend > 0 && weeekend < 6) {
            content += `\n距离周末还有${weeekend - 1}天`
        } else {
            content += `\n今天就是周末呀，快去摸鱼吧~`
        }
        content += '\n【节日预警】'
        if (holidayList.length > 0) {
            holidayList.map((item) => {
                content += `\n距离${item.festival}还有${item.diff}天`
            })
        }
        // 来自@king的写诗天赋/doge
        if (!$.isSurge()) {
            content += '\n🌞摸鱼，是在忙碌的生活中找到的一丝自我。'
            content += '\n🌞摸鱼，是在疲惫的工作中找到的一丝安慰。'
            content += '\n🌞摸鱼，是在疲惫的日子里找到的一丝微笑。'
            content += '\n🌞摸鱼，是在无尽的工作中找到的一丝平静。'
        }
        // @薛定谔的大灰机
        const notifyImgs = [
            'https://s2.loli.net/2022/02/24/SG5svAxd1eXwVDK.jpg',
            'https://s2.loli.net/2022/02/24/St2w79Qq5eDABiH.jpg',
            'https://s2.loli.net/2022/02/24/UQhuHPlIAnSY4fw.jpg',
            'https://s2.loli.net/2022/02/24/5S2DBWdz4nciIp6.jpg',
            'https://s2.loli.net/2022/02/24/SRLnuJQscvxzTlV.jpg',
            'https://s2.loli.net/2022/02/24/FjANmSHr4lYkPXL.jpg',
            'https://s2.loli.net/2022/02/24/qxhrKHpGmQzluao.jpg',
            'https://s2.loli.net/2022/02/24/thvwPN1VCesn9FK.jpg',
            'https://s2.loli.net/2022/02/24/eDM18l5tbwNkXCS.jpg',
            'https://s2.loli.net/2022/02/24/iVUOzxqIBNTA5v4.jpg'
        ]
        const notifyImage = notifyImgs[Math.floor(Math.random() * notifyImgs.length)]
        await SendNotify(scriptName, '', content, { 'media-url': notifyImage })
        resolve()
    })
}
/**
 * 农历转公历
 */
function lunar2solar(year, month, day) {
    var lunarDate = calendar.lunar2solar(year, month, day)
    return lunarDate.cYear + '/' + lunarDate.cMonth + '/' + lunarDate.cDay
}
/**
 * 获取清明节的日期
 * @param {*} fullYear
 * @returns
 */
function getQinMingJieDate() {
    //清明节的日期是不固定的，规律是：闰年开始的前2年是4月4日，闰年开始的第3年和第4年是4月5日
    if (isLeapYear(year) || isLeapYear(year - 1)) {
        return year + '/4/4'
    } else {
        return year + '/4/5'
    }
}
/**
 * 判断是否是闰年
 * @param {*} Year
 * @returns
 */
function isLeapYear(Year) {
    if ((Year % 4 == 0 && Year % 100 != 0) || Year % 400 == 0) {
        return true
    } else {
        return false
    }
}
/**
 * 万年历爬取
 * @site https://wannianrili.bmcx.com
 * @description 获取一个月黄历|使用持久化存储
 * @author 𝒀𝒖𝒉𝒆𝒏𝒈
 * @createDate 2023-06-26
 * @returns 今日黄历
 */
function getPermanentCalendar() {
    return new Promise(async (resolve, reject) => {
        const dataName = `moyu_${year}${month}`
        const data = $.getdata(dataName) || '[]'
        let dataArr = JSON.parse(data)
        if (!dataArr.length) {
            const _month = month < 10 ? '0' + month : month
            const _day = day < 10 ? '0' + day : day
            const dateStr = `${year}-${_month}-${_day}`
            const url = `https://wannianrili.bmcx.com/${dateStr}__wannianrili/`
            try {
                const html = await Request({ url, use_proxy: true })
                const htmlArr = html
                    .match(/<div class="wnrl_k_you".*>([\s\S]*?)<\/div><div class="wnrl_k_xia_id"/)[0]
                    .split('<div class="wnrl_k_xia_id"')[0]
                    .split(/<div class="wnrl_k_you" id="wnrl_k_you_id_/)
                    .filter(Boolean)
                    .map((item) => {
                        const [, date = ''] = item.match(/<div class="wnrl_k_you_id_biaoti">([\s\S]*?)<\/div>/) || [
                            '',
                            ''
                        ]
                        const [, day = ''] = item.match(/<div class="wnrl_k_you_id_wnrl_riqi">([\s\S]*?)<\/div>/) || [
                            '',
                            ''
                        ]
                        const [, lunar = ''] = item.match(
                            /<div class="wnrl_k_you_id_wnrl_nongli">([\s\S]*?)<\/div>/
                        ) || ['', '']
                        const [, lunarGanZhi = ''] = item.match(
                            /<div class="wnrl_k_you_id_wnrl_nongli_ganzhi">([\s\S]*?)<\/div>/
                        ) || ['', '']
                        const [, festivalList = ''] = item.match(
                            /<span class="wnrl_k_you_id_wnrl_jieri_neirong">([\s\S]*?)<\/span>/
                        ) || ['', '']
                        const festivals =
                            festivalList.match(/<a.*?>(.*?)<\/a>/g)?.map((item) => item.match(/<a.*?>(.*?)<\/a>/)[1]) ||
                            []
                        const [, suitList = ''] = item.match(
                            /<div class="wnrl_k_you_id_wnrl_yi">([\s\S]*?)<\/div>/
                        ) || ['', '']
                        const suit =
                            suitList.match(/<a.*?>(.*?)<\/a>/g)?.map((item) => {
                                const [, name, desc] = item.match(/<a.*?>(.*?)<\/a>/)
                                return { name, desc }
                            }) || []
                        const [, avoidList = ''] = item.match(
                            /<div class="wnrl_k_you_id_wnrl_ji">([\s\S]*?)<\/div>/
                        ) || ['', '']
                        const avoid =
                            avoidList.match(/<a.*?>(.*?)<\/a>/g)?.map((item) => {
                                const [, name, desc] = item.match(/<a.*?>(.*?)<\/a>/)
                                return { name, desc }
                            }) || []
                        return {
                            date,
                            day,
                            lunar,
                            lunarGanZhi,
                            festivals,
                            suit,
                            avoid
                        }
                    })
                $.setdata(JSON.stringify(htmlArr), `moyu_${year}${month}`)
                const prevDataName = `moyu_${year}${month - 1}`
                if ($.getdata(prevDataName)) $.setdata('', prevDataName)
                dataArr = htmlArr
            } catch (e) {
                reject(e || '获取黄历失败')
            }
        }
        const today = dataArr.find((item) => +item.day === day)
        resolve(today)
    })
}
/**
 * 获取周末时间戳
 * @returns timestamp
 */
function getWeekend() {
    const now = today
    const dayOfWeek = now.getDay()
    const daysUntilWeekend = dayOfWeek === 6 ? 0 : 6 - dayOfWeek
    const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilWeekend + 1, 0, 0, 0)
    return saturday.getTime() / 1000
}
/**
 * 获取剩余天数
 * @param {*} timestamp 时间戳
 * @returns days
 */
function getRemainDays(timestamp) {
    return Math.floor((timestamp - today.getTime().toString().slice(0, 10)) / 60 / 60 / 24)
}
// prettier-ignore
async function SendNotify(n,o="",i="",t={}){const e="undefined"!=typeof $app&&"undefined"!=typeof $http,s=t["open-url"],f=t["media-url"];if($.isQuanX()&&$notify(n,o,i,t),$.isSurge()){const t=f?`${i}\n多媒体:${f}`:i;$notification.post(n,o,t,{url:s})}if($.isLoon()){const t={};s&&(t.openUrl=s),f&&(t.mediaUrl=f),"{}"===JSON.stringify(t)?$notification.post(n,o,i):$notification.post(n,o,i,t)}const c=`${i}${s?`\n点击跳转: ${s}`:""}${f?`\n多媒体: ${f}`:""}`;if(e){const i=require("push");i.schedule({title:n,body:`${o?`${o}\n`:""}${c}`})}if($.isNode())try{const i=require("../sendNotify");await i.sendNotify(`${n}\n${o}`,c)}catch(n){console.log("没有找到sendNotify.js文件")}console.log(`${n}\n${o}\n${c}\n\n`)}
// prettier-ignore
function Request(t){const e=t.hasOwnProperty("method")?t.method.toLocaleLowerCase():"get";if($.isNode()&&t.hasOwnProperty("use_proxy")&&t.use_proxy){const e=require("tunnel"),o={https:e.httpsOverHttp({proxy:{host:"127.0.0.1",port:7890}})};Object.assign(t,{agent:o})}return new Promise((o,r)=>{$.http[e](t).then(t=>{var e=t.body;"string"!=typeof e||/(head|html)>/.test(e)||(e=JSON.parse(e)),o(e)}).catch(t=>r(t))})}
/**
 * @1900-2100区间内的公历、农历互转
 * @charset UTF-8
 * @Author Jea杨(JJonline@JJonline.Cn)
 * @Time  2014-7-21
 * @Time  2016-8-13 Fixed 2033hex、Attribution Annals
 * @Time  2016-9-25 Fixed lunar LeapMonth Param Bug
 * @Version 1.0.2
 * @公历转农历：calendar.solar2lunar(1987,11,01); //[you can ignore params of prefix 0]
 * @农历转公历：calendar.lunar2solar(1987,09,10); //[you can ignore params of prefix 0]
 */
// prettier-ignore
function loadCalendar() { calendar = { lunarInfo: [19416, 19168, 42352, 21717, 53856, 55632, 91476, 22176, 39632, 21970, 19168, 42422, 42192, 53840, 119381, 46400, 54944, 44450, 38320, 84343, 18800, 42160, 46261, 27216, 27968, 109396, 11104, 38256, 21234, 18800, 25958, 54432, 59984, 28309, 23248, 11104, 100067, 37600, 116951, 51536, 54432, 120998, 46416, 22176, 107956, 9680, 37584, 53938, 43344, 46423, 27808, 46416, 86869, 19872, 42416, 83315, 21168, 43432, 59728, 27296, 44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176, 38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46752, 103846, 38320, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256, 19189, 18800, 25776, 29859, 59984, 27480, 21952, 43872, 38613, 37600, 51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893, 43344, 46240, 47780, 44368, 21977, 19360, 42416, 86390, 21168, 43312, 31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576, 23200, 30371, 38608, 19195, 19152, 42192, 118966, 53840, 54560, 56645, 46496, 22224, 21938, 18864, 42359, 42160, 43600, 111189, 27936, 44448, 84835, 37744, 18936, 18800, 25776, 92326, 59984, 27424, 108228, 43744, 41696, 53987, 51552, 54615, 54432, 55888, 23893, 22176, 42704, 21972, 21200, 43448, 43344, 46240, 46758, 44368, 21920, 43940, 42416, 21168, 45683, 26928, 29495, 27296, 44368, 84821, 19296, 42352, 21732, 53600, 59752, 54560, 55968, 92838, 22224, 19168, 43476, 41680, 53584, 62034, 54560], solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], Gan: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"], Zhi: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], Animals: ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"], solarTerm: ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"], sTermInfo: ["9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "9778397bd19801ec9210c965cc920e", "97b6b97bd19801ec95f8c965cc920f", "97bd09801d98082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd197c36c9210c9274c91aa", "97b6b97bd19801ec95f8c965cc920e", "97bd09801d98082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec95f8c965cc920e", "97bcf97c3598082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd07f595b0b6fc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "9778397bd19801ec9210c9274c920e", "97b6b97bd19801ec95f8c965cc920f", "97bd07f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c920e", "97b6b97bd19801ec95f8c965cc920f", "97bd07f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bd07f1487f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c9274c920e", "97bcf7f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c91aa", "97b6b97bd197c36c9210c9274c920e", "97bcf7f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c920e", "97b6b7f0e47f531b0723b0b6fb0722", "7f0e37f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36b0b70c9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0787b0721", "7f0e27f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c91aa", "97b6b7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "977837f0e37f149b0723b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f5307f595b0b0bc920fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "977837f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0723b06bd", "7f07e7f0e37f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e37f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e37f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0723b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0723b06bd", "7f07e7f0e37f14998083b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14898082b0723b02d5", "7f07e7f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e36665b66aa89801e9808297c35", "665f67f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e36665b66a449801e9808297c35", "665f67f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e36665b66a449801e9808297c35", "665f67f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e26665b66a449801e9808297c35", "665f67f0e37f1489801eb072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722"], nStr1: ["日", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"], nStr2: ["初", "十", "廿", "卅"], nStr3: ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"], lYearDays: function (b) { var f, c = 348; for (f = 32768; f > 8; f >>= 1)c += calendar.lunarInfo[b - 1900] & f ? 1 : 0; return c + calendar.leapDays(b) }, leapMonth: function (b) { return 15 & calendar.lunarInfo[b - 1900] }, leapDays: function (b) { return calendar.leapMonth(b) ? 65536 & calendar.lunarInfo[b - 1900] ? 30 : 29 : 0 }, monthDays: function (b, f) { return f > 12 || f < 1 ? -1 : calendar.lunarInfo[b - 1900] & 65536 >> f ? 30 : 29 }, solarDays: function (b, f) { if (f > 12 || f < 1) return -1; var c = f - 1; return 1 == c ? b % 4 == 0 && b % 100 != 0 || b % 400 == 0 ? 29 : 28 : calendar.solarMonth[c] }, toGanZhiYear: function (b) { var f = (b - 3) % 10, c = (b - 3) % 12; return 0 == f && (f = 10), 0 == c && (c = 12), calendar.Gan[f - 1] + calendar.Zhi[c - 1] }, toAstro: function (b, f) { return "魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯".substr(2 * b - (f < [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22][b - 1] ? 2 : 0), 2) + "座" }, toGanZhi: function (b) { return calendar.Gan[b % 10] + calendar.Zhi[b % 12] }, getTerm: function (b, f) { if (b < 1900 || b > 2100) return -1; if (f < 1 || f > 24) return -1; var c = calendar.sTermInfo[b - 1900], e = [parseInt("0x" + c.substr(0, 5)).toString(), parseInt("0x" + c.substr(5, 5)).toString(), parseInt("0x" + c.substr(10, 5)).toString(), parseInt("0x" + c.substr(15, 5)).toString(), parseInt("0x" + c.substr(20, 5)).toString(), parseInt("0x" + c.substr(25, 5)).toString()], a = [e[0].substr(0, 1), e[0].substr(1, 2), e[0].substr(3, 1), e[0].substr(4, 2), e[1].substr(0, 1), e[1].substr(1, 2), e[1].substr(3, 1), e[1].substr(4, 2), e[2].substr(0, 1), e[2].substr(1, 2), e[2].substr(3, 1), e[2].substr(4, 2), e[3].substr(0, 1), e[3].substr(1, 2), e[3].substr(3, 1), e[3].substr(4, 2), e[4].substr(0, 1), e[4].substr(1, 2), e[4].substr(3, 1), e[4].substr(4, 2), e[5].substr(0, 1), e[5].substr(1, 2), e[5].substr(3, 1), e[5].substr(4, 2)]; return parseInt(a[f - 1]) }, toChinaMonth: function (b) { if (b > 12 || b < 1) return -1; var f = calendar.nStr3[b - 1]; return f += "月" }, toChinaDay: function (b) { var f; switch (b) { case 10: f = "初十"; break; case 20: f = "二十"; break; case 30: f = "三十"; break; default: f = calendar.nStr2[Math.floor(b / 10)], f += calendar.nStr1[b % 10] }return f }, getAnimal: function (b) { return calendar.Animals[(b - 4) % 12] }, solar2lunar: function (b, f, c) { if (b < 1900 || b > 2100) return -1; if (1900 == b && 1 == f && c < 31) return -1; if (b) e = new Date(b, parseInt(f) - 1, c); else var e = new Date; var a, r = 0, d = (b = e.getFullYear(), f = e.getMonth() + 1, c = e.getDate(), (Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()) - Date.UTC(1900, 0, 31)) / 864e5); for (a = 1900; a < 2101 && d > 0; a++)d -= r = calendar.lYearDays(a); d < 0 && (d += r, a--); var n = new Date, t = !1; n.getFullYear() == b && n.getMonth() + 1 == f && n.getDate() == c && (t = !0); var s = e.getDay(), l = calendar.nStr1[s]; 0 == s && (s = 7); var u = a, o = calendar.leapMonth(a), i = !1; for (a = 1; a < 13 && d > 0; a++)o > 0 && a == o + 1 && 0 == i ? (--a, i = !0, r = calendar.leapDays(u)) : r = calendar.monthDays(u, a), 1 == i && a == o + 1 && (i = !1), d -= r; 0 == d && o > 0 && a == o + 1 && (i ? i = !1 : (i = !0, --a)), d < 0 && (d += r, --a); var h = a, D = d + 1, g = f - 1, y = calendar.toGanZhiYear(u), p = calendar.getTerm(u, 2 * f - 1), m = calendar.getTerm(u, 2 * f), v = calendar.toGanZhi(12 * (b - 1900) + f + 11); c >= p && (v = calendar.toGanZhi(12 * (b - 1900) + f + 12)); var M = !1, T = null; p == c && (M = !0, T = calendar.solarTerm[2 * f - 2]), m == c && (M = !0, T = calendar.solarTerm[2 * f - 1]); var I = Date.UTC(b, g, 1, 0, 0, 0, 0) / 864e5 + 25567 + 10, C = calendar.toGanZhi(I + c - 1), S = calendar.toAstro(f, c); return { lYear: u, lMonth: h, lDay: D, Animal: calendar.getAnimal(u), IMonthCn: (i ? "闰" : "") + calendar.toChinaMonth(h), IDayCn: calendar.toChinaDay(D), cYear: b, cMonth: f, cDay: c, gzYear: y, gzMonth: v, gzDay: C, isToday: t, isLeap: i, nWeek: s, ncWeek: "星期" + l, isTerm: M, Term: T, astro: S } }, lunar2solar: function (b, f, c, e) { e = !!e; var a = calendar.leapMonth(b); calendar.leapDays(b); if (e && a != f) return -1; if (2100 == b && 12 == f && c > 1 || 1900 == b && 1 == f && c < 31) return -1; var r = calendar.monthDays(b, f), d = r; if (e && (d = calendar.leapDays(b, f)), b < 1900 || b > 2100 || c > d) return -1; for (var n = 0, t = 1900; t < b; t++)n += calendar.lYearDays(t); var s = 0, l = !1; for (t = 1; t < f; t++)s = calendar.leapMonth(b), l || s <= t && s > 0 && (n += calendar.leapDays(b), l = !0), n += calendar.monthDays(b, t); e && (n += r); var u = Date.UTC(1900, 1, 30, 0, 0, 0), o = new Date(864e5 * (n + c - 31) + u), i = o.getUTCFullYear(), h = o.getUTCMonth() + 1, D = o.getUTCDate(); return calendar.solar2lunar(i, h, D) } } }
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, a) => { s.call(this, t, (t, s, r) => { t ? a(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const a = this.getdata(t); if (a) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, a) => e(a)) }) } runScript(t, e) { return new Promise(s => { let a = this.getdata("@chavy_boxjs_userCfgs.httpapi"); a = a ? a.replace(/\n/g, "").trim() : a; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, o] = a.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, a) => s(a)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e); if (!s && !a) return {}; { const a = s ? t : e; try { return JSON.parse(this.fs.readFileSync(a)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const a = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of a) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, a, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: a, response: r } = t; e(a, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let a = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && a.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let a = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ("00" + a[e]).substr(("" + a[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let a = t[s]; null != a && "" !== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", a = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": a } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, a, i(r)); break; case "Quantumult X": $notify(e, s, a, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t); break; case "Node.js": this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
