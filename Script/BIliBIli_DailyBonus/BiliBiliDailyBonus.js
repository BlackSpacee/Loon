/*
哔哩哔哩每日任务

更新时间: 2023-11-1
脚本兼容: QuantumultX, Surge, Loon
脚本作者: MartinsKing（@ClydeTime）
软件功能: 登录/观看/分享/投币/直播签到/银瓜子转硬币/大会员积分签到/年度大会员每月B币券+等任务
注意事项:
	抓取cookie时注意保证账号登录状态;
	账号内须有一定数量的关注数，否则无法完成投币;
	当硬币不足5枚，提示硬币不足，停止投币;
	为保证投币任务成功, 脚本有重试机制(最多重试10次), 以确保任务完成, 前提需要您尽可能多的关注Up主;
	年度大会员每月B币券会在每月1号、15号尝试领取，确保应用正常运行, 以防漏领;
	年度大会员自动充电会在每次领劵之后进行, 默认为自己充电, B币多的用户可自行到boxjs设置，以防误充.
使用声明: ⚠️此脚本仅供学习与交流，请勿贩卖！⚠️
脚本参考: Nobyda、Wyatt1026、ABreadTree、chavyleung、SocialSisterYi
************************
QX, Surge, Loon说明：
************************
1.获取cookie
	①后台退出手机B站客户端的情况下, 重新打开APP进入主页
	②通过网址「https://www.bilibili.com」登录（`暂不支持Loon`）
如通知成功获取cookie, 则可以使用此签到脚本.
脚本将在每天上午7点30执行.
2.投币设置
定时任务脚本投币规则为: 随机获取关注列表Up主视频, 默认5视频5硬币, 不点赞.
用户如需要不投币的版本, 请使用boxjs订阅「https://raw.githubusercontent.com/ClydeTime/BiliBili/main/boxjs/BiliBili.boxjs.json」
将投币次数置为0, 并保存即可.
/***********************
Surge 脚本配置:
************************

# B站每日等级任务 「请在模块中添加」
https://raw.githubusercontent.com/ClydeTime/BiliBili/main/modules/BiliBiliDailyBonus.sgmodule

************************
QuantumultX 远程脚本配置:
************************

# B站每日等级任务 「请在重写中添加」
https://raw.githubusercontent.com/ClydeTime/BiliBili/main/modules/BiliBiliDailyBonus.snippet

************************
Loon 远程脚本配置:
************************

# B站每日等级任务 「请在插件中添加」
https://raw.githubusercontent.com/ClydeTime/BiliBili/main/modules/BiliBiliDailyBonus.plugin
*/

const format = (ts, fmt = 'yyyy-MM-dd HH:mm:ss') => {
	return $.time(fmt, ts);
}

const check = (key) =>
	!config.hasOwnProperty(key) ||
	!config[key].hasOwnProperty("time") ||
	!(config[key]["num"] > 0) ||
	format(new Date().toDateString()) > config[key].time;

const cookie2object = (cookie) => {
	var obj = {};
	var arr = cookie.split("; ");
	arr.forEach(function (val) {
		var brr = val.split("=");
		obj[brr[0]] = brr[1];
	});
	return obj;
}

const setCookieToLocalStore = async (config, times) => {
	if (config.cookie.DedeUserID) {
		var url = $request.url
		config.key = url.match(/.*access_key=(.*?)&build/)?.[1]
		config.cookieStr = `DedeUserID=${config.cookie.DedeUserID}; DedeUserID__ckMd5=${config.cookie.DedeUserID__ckMd5}; SESSDATA=${config.cookie.SESSDATA}; bili_jct=${config.cookie.bili_jct}; sid=${config.cookie.sid}`
		if (!config.key) {
			let confirm_uri = await getConfirm_uri()
			let envType = $.getEnv()
			if (envType === 'Surge') {
				await captureAccess_key(confirm_uri)
				await getRecentRequests()
			}else if (envType === 'Quantumult X') {
				await getAccess_key(confirm_uri)
			}//'Loon need to do'
		}
		if (times === 1) {
			$.setdata($.toStr(config), $.name + "_daily_bonus")
				? $.msg($.name, "首次获取cookie", "🎉获取 cookie 成功")
				: $.msg($.name, "首次获取cookie", "🤒获取 cookie 失败")
		} else {
			$.setdata($.toStr(config), $.name + "_daily_bonus")
				? $.msg($.name, "检测到cookie已更新", "🎉更新 cookie 成功")
				: $.msg($.name, "检测到cookie已更新", "🤒更新 cookie 失败")
		}
	} else {
		$.msg($.name, "- 尚未登录, 请登录后重新获取cookie")
	}
}

const $ = new Env("bilibili")
const startTime = format()
let config = {
	cookie: {},
	cookieStr: "",
	key: "",
	user: {},
	watch: {},
	share: {},
	coins: {},
	score: {}
}
let cards = []
let real_times //实际需要投币次数

!(async () => {
	if (typeof $request != "undefined") {
		$.log("- 正在获取cookie, 请稍后")
		await getCookie()
	} else {
		await signBiliBili()
	}
})()
	.catch((e) => $.logErr(e))
	.finally(() => $.done())

async function getCookie() {
	if ('object' == typeof $request) {
		let Cookie
		if (typeof $request.headers.cookie != 'undefined') {
			Cookie = $request.headers.cookie
		} else if (typeof $request.headers.Cookie != 'undefined') {
			Cookie = $request.headers.Cookie
		}
		if (Boolean(Cookie)) {
			config.cookie = cookie2object(Cookie)
			original_config = $.getjson($.name + "_daily_bonus", {})
			if (Boolean(original_config.cookie)) {
				if (original_config.cookie.bili_jct === config.cookie.bili_jct) {
					$.log("- cookie未失效,无需更新")
				} else {
					await setCookieToLocalStore(config, 2)
				}
			} else {
				await setCookieToLocalStore(config, 1)
			}
		} else {
			$.msg($.name, "- 尚未登录, 请登录后重新获取cookie")
		}
	}
}

async function getConfirm_uri() {
	var sign = md5("api=http://link.acg.tv/forum.php" + 'c2ed53a74eeefe3cf99fbd01d8c9c375')
	const myRequest = {
			url: "https://passport.bilibili.com/login/app/third?appkey=27eb53fc9058f8c3&api=http://link.acg.tv/forum.php&sign=" + sign,
			headers: {
				"cookie": config.cookieStr
			}
	}
	return await $.http.get(myRequest).then(response => {
		try {
			const body = $.toObj(response.body)
			if (body?.code === 0) {
				return body?.data?.confirm_uri
			} else {
				$.log("- 查询失败")
				$.log("- 失败原因 " + body?.message)
			}
		} catch (e) {
			$.logErr(e, response)
		}
	}, reason => {
		$.log("- 失败原因 " + $.toStr(reason))
		return "error"
	})
}

function captureAccess_key(confirm_uri) {
	return new Promise((resolve, reject) => {
		const myRequest = {
				url: confirm_uri,
				headers: {
					"cookie": config.cookieStr
				}
		}
		$.get(myRequest,(err, resp, data) => {
			if (err) reject(err)
			else {
				try {
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function getAccess_key(confirm_uri) {
	return new Promise((resolve, reject) => {
		$.log("- 正在获取access_key, 请稍后")
		const myRequest = {
				url: confirm_uri,
				headers: {
					"cookie": config.cookieStr
				},
				opts: {
					"redirection": false
				}
		}
		$.get(myRequest,(err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const url = resp.headers.Location
					if (url) {
						config.key = url.match(/.*access_key=(.*?)&mid/)?.[1]
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function getRecentRequests() {
	return new Promise((resolve, reject) => {
		$.log("- 正在获取最近请求列表, 请稍后")
		$httpAPI("GET","/v1/requests/recent",null,(result) => {
			if (!result) reject(result)
			else {
				try {
					const url = result.requests.find(request => request.URL.includes("access_key"))?.URL;
					if (url) {
						config.key = url.match(/.*access_key=(.*?)&mid/)?.[1]
					}
				} catch (e) {
					$.logErr(e, result)
				} finally {
					resolve()
				}
			}
		})
	})
}

async function signBiliBili() {
	config = $.getjson($.name + "_daily_bonus", {})
	if (config.cookie && await me()) {
		await queryStatus()
		var flag = true
		let exec_times = config.Settings?.exec	//用户设置投币次数
		if (!Boolean(exec_times)) {
			exec_times = 0
			real_times = 5 - (Number(config.coins.num) / 10)
		} else {
			exec_times = Number(exec_times)
			real_times = Math.max(0, exec_times - (Number(config.coins.num) / 10))
		}
		
		if (config.user.num < 1 || config.watch.num < 1 || config.share.num < 1 || (config.coins.num < exec_times * 10 && Math.floor(config.user.money) > 5)) flag = false
		if (!flag){
			await dynamic()
			if (cards.length) {
				item = cards[Math.floor(Math.random() * cards.length)]
				card = $.toObj(item.card)
				short_link = encodeURIComponent(card?.short_link_v2.replace(/\\\//g, '/'))
				await watch(item.desc.rid, item.desc.bvid, card.cid)
				await share(item.desc.rid, card.cid, short_link)
			} else {
				$.log("- 获取视频失败，请重试或寻求帮助")
			}

			$.log("3️⃣ 投币任务")
			if (real_times === 0){
				$.log(`- 今日已完成 ${config.coins.time}`)
			} else {
				for (var i = 0; i < real_times; i ++) {
					if (Math.floor(config.user.money) <= 5) {
						$.log("- 硬币不足,投币失败")
						break
					} else {
						await coin()
						await $.wait(300) //减少频繁请求概率
					}
				}
			}
			$.log("---- 将尝试额外任务")
		} else {
			$.log("---- 经验值任务均已完成,将尝试额外任务")
		}
		
		await liveSign()
		await silver2coin()
		await vipScoreSign()
		if (config.user.vipStatus === 1) {
			await vipExtraEx()
			await vipScoreGo()
			await vipScoreFan()
			await vipScoreMovie()
			await vipScoreDress()
			await vipWatchAccept()
			//B币券每月尝试两次领取
			if ($.time('dd') === '1' || $.time('dd') === '15') {
				if (config.user.vipType === 2) {
					await vipPrivilege(1)
					await $.wait(800); //延迟执行，防止领劵延迟
					let charge_mid = config.Settings?.charge_mid || config.user.mid
					let bp_num = config.Settings?.bp_num || 5
					await Charge(charge_mid, bp_num)//充电
					await vipPrivilege(2)
					await vipPrivilege(3)
					await vipPrivilege(4)
					await vipPrivilege(5)
					await vipPrivilege(6)
					await vipPrivilege(7)
				}else if (config.user.vipType === 1) {
					await vipPrivilege(6)
					await vipPrivilege(7)
				}
			} 
		}
		flag =
			config.user.num < 1 ||
			config.watch.num < 1 ||
			config.share.num < 1 ||
			(config.coins.num < exec_times * 10 && Math.floor(config.user.money) > 5)	//硬币不足也算完成任务
				? false
				: true
		let title = `${$.name} 登录${config.user.num}/观看${config.watch.num}/分享${config.share.num}/投币${config.coins.num / 10}${flag ? "已完成" : "未完成"}`
		$.log(`#### ${title}`)

		let u = `登录时间: ${config.user.time || "暂无"}`
		let w = `观看时间: ${config.watch.time || "暂无"}`
		let s = `分享时间: ${config.share.time || "暂无"}`
		let z = `投币时间: ${config.coins.time || "暂无"}`
		$.log(`- ${u}`)
		$.log(`- ${w}`)
		$.log(`- ${s}`)
		$.log(`- ${z}`)

		//$.msg(title, `📅  ${startTime}`, `${u}\n${w}\n${s}`)

		notice = {
			title: `${$.name} [${config.user.uname}]`,
			content:
				`任务:登录(观看)${check("watch") ? "" : "+10exp"} 分享${check("share") ? "" : "+5exp"} 投币${check("coins") ? "" : "+50exp"}\n` +
				`经验:当前${config.user.level_info.current_exp}/下级${config.user.level_info.next_exp}/满级28800\n` +
				`等级:当前${config.user.level_info.current_level}级 升满级最快需${Math.ceil((config.user.v6_exp)/65)}天`,
		}
		if (!flag) {
			$.msg(notice.title, "❗️有未完成的任务", notice.content)
		} else {
			$.msg(notice.title, "✅任务完成", notice.content)
		}
	} else {
		$.msg(`${$.name} 任务失败`,`📅 ${startTime}`, "🤒请更新cookie")
	}
}

function queryStatus() {
	return new Promise((resolve, reject) => {
		$.log("#### 检查任务进行状况")
		const myRequest = {
				url: "https://api.bilibili.com/x/member/web/exp/reward",
				headers: {
					"cookie": config.cookieStr
				}
		}
		$.get(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0) {
						if (body.data.login) {
							$.log("- 今日已登录")
							config.user.num = (config.user.num == 0 ? 1 : config.user.num)
							if (!config['user'].hasOwnProperty("time")) {
								config.user.time = startTime
							}
						} else {
							$.log("! 今日尚未登录")
							config.user.num = 0
						}
						if (body.data.watch){
							$.log("- 今日已观看")
							config.watch.num = (config.watch.num == 0 || typeof config.watch.num=='undefined' ? 1 : config.watch.num)
							if (!config['watch'].hasOwnProperty("time")) {
								config.watch.time = startTime
							}
						} else {
							$.log("! 今日尚未观看")
							config.watch.num = 0
						}
						if (body.data.share){
							$.log("- 今日已分享")
							config.share.num = (config.share.num == 0 || typeof config.share.num=='undefined' ? 1 : config.share.num)
							if (!config['share'].hasOwnProperty("time")) {
								config.share.time = startTime
							}
						} else {
							$.log("! 今日尚未分享")
							config.share.num = 0
						}
						if (body.data.coins === 50){
							$.log("- 今日已投币")
							config.coins.num = 50
							if (!config['coins'].hasOwnProperty("time")) {
								config.coins.time = startTime
							} else {
								if (format(new Date().toDateString()) > config.coins.time) {
									config.coins.time = startTime
								}
							}
						} else if ((body.data.coins / 10) >= real_times) {
							config.coins.time = startTime
							$.log("- 今日投币已完成用户预期")
							config.coins.num = body.data.coins
						} else if (config.user.money <= 5) {
							$.log("! 硬币数不足")
							config.coins.num = body.data.coins
						} else {
							$.log("! 今日投币未完成")
							config.coins.num = body.data.coins
						}
						$.setdata($.toStr(config), $.name + "_daily_bonus")
					} else {
						$.log("- 查询失败")
						$.log("- 失败原因 " + body?.message)
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

async function watch(aid, bvid, cid) {
	$.log("1️⃣ 观看(登录)任务")
	if (check("watch")) {
		$.log(`- 正在观看(登录)(${bvid})`)
		const body = {
			aid: aid,
			cid: cid,
			bvid: bvid,
			mid: config.user.mid,
			csrf: config.cookie.bili_jct,
			played_time : 1,
			real_played_time: 1,
			realtime: 1,
			start_ts: parseInt($.startTime / 1000),
			type: 3,
			dt: 2,
			play_type: 0,
			from_spmid: 0,
			spmid: 0,
			auto_continued_play: 0,
			refer_url: "https%3A%2F%2Ft.bilibili.com%2F",
			bsource: ""
		}
		const myRequest = {
			url: 'https://api.bilibili.com/x/click-interface/web/heartbeat',
			headers: {
				"cookie": config.cookieStr,
				"referrer": `https://www.bilibili.com/video/${bvid}`
			},
			body: $.queryStr(body)
		}
		await $.http.post(myRequest).then(response => {
			const body = $.toObj(response.body)
			if (body?.code === 0) {
				$.log(`- 累计观看(登录)次数 ${(config.watch.num || 0) + 1}`)
				config.user.num = (config.user.num || 0) + 1
				config.watch.num = (config.watch.num || 0) + 1
				$.setdata($.toStr(config), $.name + "_daily_bonus")
			} else {
				$.log("- 观看失败, 失败原因: " + body?.message)
			}
		})
	} else {
		$.log(`- 今日已经观看 ${config.watch.time}`)
	}
}

async function share(aid, cid, short_link) {
	$.log("2️⃣ 分享任务")
	if (check("share")) {
		$.log("- 正在分享, aid=" + aid)
		var body = {
			access_key: config.key.replace(/&actionKey=.*?&appkey=.*$/, ''),
			actionKey: 'appkey',
			appkey: '27eb53fc9058f8c3',
			build: '72700100',
			c_locale: 'zh-Hans_CN',
			device: 'phone',
			disable_rcmd: 0,
			link: short_link,
			mobi_app: 'iphone',
			object_extra_fields: '%7B%7D',
			oid: aid,
			panel_type: 1,
			platform: 'ios',
			s_locale:'zh-Hans_CN',
			share_channel: 'WEIXIN',
			share_id: 'main.ugc-video-detail.0.0.pv',
			share_origin: 'vinfo_share',
			sid: cid,
			spm_id: 'main.ugc-video-detail.0.0',
			statistics: '%7B%22appId%22%3A1%2C%22version%22%3A%227.27.0%22%2C%22abtest%22%3A%22%22%2C%22platform%22%3A1%7D',
			success: 1,
			ts: parseInt($.startTime / 1000)
		}
		var sign = md5($.queryStr(body) + 'c2ed53a74eeefe3cf99fbd01d8c9c375')
		body['sign'] = sign
		const myRequest = {
			url: 'https://api.bilibili.com/x/share/finish',
			headers: {},
			body: $.queryStr(Object.fromEntries(new Map(Array.from(Object.entries(body)).sort())))
		}
		await $.http.post(myRequest).then(async response => {
			const body = $.toObj(response.body)
			if (body?.code === 0) {
				config.share.num = (config.share.num || 0) + 1
				$.log("- 分享成功")
				$.setdata($.toStr(config), $.name + "_daily_bonus")
			} else {
				$.log("- 分享失败, 失败原因: " + body?.message)
			}
		})
	} else {
		$.log(`- 今日已经分享 ${config.share.time}`)
	}
}

async function coin() {
	if (config.coins.num >= 50) {
		$.log(`- 今日已完成 ${config.coins.time}`)
		return true
	} else {
		let like_uid_list = await getFavUid()
		if (like_uid_list && like_uid_list.length > 0) {
			let aid = await getFavAid(like_uid_list)
			//$.log("即将投币的视频aid: " + aid)
			if (aid !== 0) {
				const body = {
					aid: aid,
					multiply: 1,
					select_like: 0,
					cross_domain: true,
					csrf: config.cookie.bili_jct
				}
				const myRequest = {
					url: "https://api.bilibili.com/x/web-interface/coin/add",
					headers: {
						'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
						'accept': 'application/json, text/plain, */*',
						'content-type': 'application/x-www-form-urlencoded',
						'origin': 'https://www.bilibili.com',
						'referer': 'https://www.bilibili.com/video/BV1MT411G7fG?vd_source=1970993e2eff4af7be029aefcfa468b8',
						'cookie': config.cookieStr
					},
					body: $.queryStr(body)
				}
				await $.http.post(myRequest).then(async response => {
					try {
						const body = $.toObj(response.body)
						if (body.code === 0 && body.message == 0) {
							$.log("- 投币成功")
							config.user.money -= 1
							config.coins.num += 10
							$.setdata($.toStr(config), $.name + "_daily_bonus")
						} else {
							$.log("- 投币失败,失败原因 " + body.message)
							config.coins.failures = (config.coins.failures == 0 || typeof config.coins.failures == 'undefined' ? 1 : config.coins.failures + 1)
							$.setdata($.toStr(config), $.name + "_daily_bonus")
							if (config.coins.failures < 11) {
								$.log("- 正在重试...重试次数 " + (config.coins.failures - 1) + "(超过十次不再重试)")
								await coin()
							}
						}
					} catch (e) {
						$.logErr(e, response)
					}
				})
			} else {
				$.log("获取随机投币视频失败")
			}
		} else {
			$.log("获取随机关注用户列表失败")
		}
	}
}

async function getFavUid() {
	const myRequest = {
		url: `https://api.bilibili.com/x/relation/followings?vmid=${config.cookie.DedeUserID}&ps=10&order_type=attention`,
		headers: {
			'cookie': config.cookieStr
		}
	}
	return await $.http.get(myRequest).then(response => {
		try {
			const body = $.toObj(response.body)
			let like_uid_list = new Array()
			if (body?.code === 0) {
				$.log("- 获取关注列表成功")
				let like_list = body?.data?.list
				//let $.name_list = new Array()
				for (var i = 0; i < like_list.length; i ++) {
					//$.name_list[i] = like_list[i].u$.name
					like_uid_list[i] = like_list[i].mid
				}
				return like_uid_list
				//$.log($.toStr($.name_list))
			} else {
				$.log("- 获取关注列表成失败")
				$.log("- 失败原因 " + body?.message)
				return like_uid_list
			}
		} catch (e) {
			$.logErr(e, response)
		}
	})
}

async function getFavAid(arr) {
	//$.log("- 获取关注列表中的随机视频")
	var random_int = Math.floor((Math.random()*arr.length))
	var random_mid = arr[random_int]
	var wbiSigns = getWbiSigns({mid: random_mid})
	const myRequest = {
		url: `https://api.bilibili.com/x/space/wbi/arc/search?${wbiSigns}`,
		headers: {
			'cookie': config.cookieStr
		}
	}
	return await $.http.get(myRequest).then(response => {
		try {
			const body = $.toObj(response.body)
			if (body?.code === 0) {
				$.log("- 获取投币视频成功")
				let vlist = body.data?.list?.vlist
				let random_v_int = Math.floor((Math.random() * vlist.length))
				let aid = vlist[random_v_int]?.aid
				$.log("- 作者: " + vlist[random_v_int]['author'] + "; 视频标题: " + vlist[random_v_int]['title'])
				return aid
			} else {
				$.log("- 获取投币视频失败")
				$.log("- 失败原因 " + body?.message)
				return 0
			}
		} catch (e) {
			$.logErr(e, response)
		}
	}, reason => {
		$.log("- 获取投币视频失败")
		$.log("- 失败原因 " + $.toStr(reason))
		return 0
	})
}

function silver2coin() {
	return new Promise((resolve, reject) => {
		$.log("#### 银瓜子兑换硬币任务")
		const body = {
			csrf: config.cookie.bili_jct,
			csrf_token: config.cookie.bili_jct
		}
		const myRequest = {
			url: "https://api.live.bilibili.com/xlive/revenue/v1/wallet/silver2coin",
			headers: {
				'cookie': config.cookieStr
			},
			body: $.queryStr(body)
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					let result = $.toObj(data)
					let title = `${$.name} 银瓜子转硬币`
					// 兑换成功
					if (result && result.code == 0) {
						let subTitle = `- ${result.message}`
						let detail = `- 成功兑换: ${result.data.coin} 个硬币\n当前银瓜子: ${result.data.silver} , 当前金瓜子: ${result.data.gold}`
						$.log(subTitle)
						$.log(detail)
						$.msg(title, subTitle, detail)
					}
					// 兑换中止（重复兑换&银瓜子不足）
					else if (result && result.code == 403) {
						let subTitle = "- 未成功兑换"
						let detail = `- 原因: ${result.message}`
						$.log(subTitle)
						$.log(detail)
						$.msg(title, subTitle, detail)
					}
					// 兑换失败
					else {
						let subTitle = "- 兑换失败"
						let detail = `- 原因: ${result.message}`
						$.log(subTitle)
						$.log(detail)
						$.msg(title, subTitle, detail)
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function liveSign() {
	return new Promise((resolve, reject) => {
		$.log("#### 直播签到任务")
		const myRequest = {
			url: "https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",
			headers: {
				'cookie': config.cookieStr
			}
		}
		$.get(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					let body = $.toObj(data)
					if (body?.code === 0) {
						$.log("- 签到成功")
						$.log(`签到奖励:${body.data.text},连续签到${body.data.hadSignDays}天`)
					} else if (body && body.code == 1011040){
						$.log("- 今日已完成")
					} else {
						$.log("- 签到失败")
						$.log("- 失败原因 " + body?.message)
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

async function vipScoreSign() {
	$.log("#### 大会员大积分签到任务")
	if (config.user.vipStatus === 0) {
		$.log("- 当前用户非大会员, 无法完成任务")
	} else {
		if (check("score")) {
			const myRequest = {
				url: "https://api.bilibili.com/pgc/activity/score/task/sign",
				headers: {
					'Referer': 'https://big.bilibili.com/mobile/bigPoint/task',
					'cookie': config.cookieStr
				}
			}
			await $.http.post(myRequest).then(response => {
				try {
					const body = $.toObj(response.body)
					if (body?.code === 0 && body?.message === "success") {
						$.log("- 签到成功")
						config.score.time = startTime
						config.score.num = 1
						$.setdata($.toStr(config), $.name + "_daily_bonus")
					} else {
						$.log("- 签到失败")
						$.log("- 失败原因 " + body?.message)
					}
				} catch (e) {
					$.logErr(e, resp)
				}
			})
		} else {
			$.log("- 今日已完成")
		}
	}
}

function vipExtraEx() {
	return new Promise((resolve, reject) => {
		$.log("#### 大会员每日额外经验值")
		const body = {
			csrf: config.cookie.bili_jct,
			mobi_app: 'iphone',
			platform:'ios',
			appkey:'27eb53fc9058f8c3',
			access_key:`${config.key}`
		}
		const myRequest = {
			url: "https://api.bilibili.com/x/vip/experience/add",
			headers: {
				'Accept:' : `application/json, text/plain, */*`,
				'App-key': 'iphone'
			},
			body: $.queryStr(body)
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code == 0 && body?.message == "0") {
						$.log("- 成功获得10经验值")
						return true
					} else {
						$.log("- 每日额外经验任务失败")
						$.log("- 失败原因 " + body?.message)
						return false
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipScoreGo() {
	return new Promise((resolve, reject) => {
		$.log("#### 大会员浏览会员购10s任务")
		const myRequest = {
			url: "https://show.bilibili.com/api/activity/fire/common/event/dispatch",
			headers: {
				'Content-Type' : `application/json`,
				'Cookie': config.cookieStr
			},
			body: `{"eventId":"hevent_oy4b7h3epeb"}`
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code == 0 && body?.message == "SUCCESS") {
						$.log("- 成功获得10点大积分")
						return true
					} else {
						$.log("- 浏览会员购任务失败")
						$.log("- 失败原因 " + body?.message)
						return false
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipScoreFan() {
	return new Promise((resolve, reject) => {
		$.log("#### 大会员浏览追番频道10s任务")
		const myRequest = {
			url: `https://api.bilibili.com/pgc/activity/deliver/task/complete?access_key=${config.key}&position=jp_channel&sign=768d600feba34e6d1109e4157c0f0c5f&task_sign=557D1ACE13E9E81393259FFB621D6D0E`,
			headers: {}
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0 && body?.message === "success") {
						$.log("- 成功获得10点大积分")
					} else {
						$.log("- 浏览追番频道任务失败")
						$.log("- 失败原因 " + body?.message)
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipScoreMovie() {
	return new Promise((resolve, reject) => {
		$.log("#### 大会员浏览影视频道10s任务")
		const myRequest = {
			url: `https://api.bilibili.com/pgc/activity/deliver/task/complete?access_key=${config.key}&position=tv_channel&sign=09ece1c295cb86d74778b93c59c0da3a&task_sign=B7DA5FAE25C39F53C62C03076CF2878B`,
			headers: {}
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0 && body?.message === "success") {
						$.log("- 成功获得10点大积分")
						return true
					} else {
						$.log("- 浏览影视频道任务失败")
						$.log("- 失败原因 " + body?.message)
						return false
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipScoreDress() {
	return new Promise((resolve, reject) => {
		$.log("#### 大会员浏览装扮商城主页任务")
		const body = {
			csrf: config.cookie.bili_jct,
			ts: parseInt($.startTime / 1000),
			taskCode: 'dress-view',
			access_key: config.key
		}
		const myRequest = {
			url: 'https://api.bilibili.com/pgc/activity/score/task/complete/v2',
			headers: {},
			body: $.queryStr(body)
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0 && body?.message === "success") {
						$.log("- 成功获得10点大积分")
					} else {
						$.log("- 浏览装扮商城主页任务失败")
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipWatchAccept() {
	return new Promise((resolve, reject) => {
		$.log("#### 接取大会员观看正片30min任务")
		const myRequest = {
			url: 'https://api.bilibili.com/pgc/activity/score/task/receive',
			headers: {
				'Content-Type' : `application/json`,
				'Cookie' : `SESSDATA=${config.cookie.SESSDATA}`,
				'Referer' : `https://big.bilibili.com/mobile/bigPoint/task`
			},
			body: `{"taskCode":"ogvwatch"}`
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0 && body?.message === "success") {
						$.log("- 大会员观看正片任务接取成功, 需自行观看")
					} else {
						$.log("- 大会员观看正片任务接取失败")
						$.log("- 失败原因 " + body?.message)
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function vipPrivilege(type) {
	return new Promise((resolve, reject) => {
		$.log("#### 领取大会员月度福利")
		const body = {
			csrf: config.cookie.bili_jct,
			type: type
		}
		const myRequest = {
			url: 'https://api.bilibili.com/x/vip/privilege/receive',
			headers: {
				'Cookie': config.cookieStr
			},
			body: $.queryStr(body)
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0) {
						if (type === 1) {
							$.log("- 领取年度大会员每月B币券成功")
							$.msg("年度大会员月度福利", "B币券", "🎉🎉🎉领取成功")
						}else if (type === 2) {
							$.log("- 领取年度大会员每月会员购优惠券成功")
						}else if (type === 3) {
							$.log("- 领取年度大会员每月漫画福利券成功")
						}else if (type === 4) {
							$.log("- 领取年度大会员每月会员购包邮券成功")
						}else if (type === 5) {
							$.log("- 领取年度大会员每月漫画商城优惠券成功")
						}else if (type === 6) {
							$.log("- 领取大会员每月装扮体验卡成功")
						}else if (type === 7) {
							$.log("- 领取大会员每月课堂优惠券成功")
						}
					} else {
						$.log("- 领取大会员每月福利失败, 福利编码为" + type)
						$.log("- 失败原因 " + body?.message)
						if (type === 1) {
							$.msg("年度大会员月度福利", "B币券领取失败", "失败原因为: " + body?.message)
						}
						//其他福利没什么用,失败也无需单独通知
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function Charge(mid, bp_num) {
	return new Promise((resolve, reject) => {
		$.log("#### B币券自动充电")
		const body = {
			bp_num: bp_num,
			is_bp_remains_prior: true,
			up_mid: mid,
			otype: 'up',
			oid: mid,
			csrf: config.cookie.bili_jct
		}
		const myRequest = {
			url: 'https://api.bilibili.com/x/ugcpay/web/v2/trade/elec/pay/quick',
			headers: {
				'Cookie': config.cookieStr
			},
			body: $.queryStr(body)
		}
		$.post(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.code === 0) {
						if (body?.data?.status === 4) {
							if (mid === config.user.mid) {
								$.log("- 为自己充电成功")
							} else {
								$.log(`- 为用户id为${mid}的用户充电成功`)
							}
						} else if (body?.data?.status === -4) {
							$.log("- 充电失败, B币不足")
						} else {
							$.log("- 充电失败")
							$.log("- 失败原因 " + body?.message)
						}
						return true
					} else {
						$.log("- 充电失败")
						$.log("- 失败原因 " + body?.message)
						return false
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

function me() {
	$.log("#### 用户信息")
	const myRequest = {
		url: 'https://api.bilibili.com/x/web-interface/nav',
		headers: {
			"cookie": config.cookieStr
		}
	}
	return $.http.get(myRequest).then(response => {
		try {
			const body = $.toObj(response.body)
			if (body?.code) {
				$.log("- ❌❌获得用户信息失败(请更新cookie)")
				$.setdata(null, $.name + "_daily_bonus")
				return false
			} else {
				$.log("- 🎉cookie有效任务即将开始🎉")
				if (check("user")) {
					config.user = body?.data
					config.user.num = 1
				} else {
					config.user.num = (config.user.num || 0) + 1
				}
				$.setdata($.toStr(config), $.name + "_daily_bonus")

				config.user.mext_exp = config.user.level_info.next_exp - config.user.level_info.current_exp
				config.user.next_day = Math.ceil(config.user.mext_exp / 15)
				config.user.v6_exp = 28800 - config.user.level_info.current_exp
				config.user.v6_day = Math.ceil(config.user.v6_exp / 15)

				if (config.user.vipStatus === 1) {
					$.log("- 💖尊贵的大会员用户💖")
				}
				$.log("- 用户名称: " + config.user.uname)
				$.log("- 用户ID: " + config.user.mid)
				$.log("- 用户硬币: " + Math.floor(config.user.money))
				$.log("- 用户B币: " + config.user.wallet.bcoin_balance)
				$.log("- 用户等级: " + config.user.level_info.current_level)
				$.log(
					`- 当前经验: ${config.user.level_info.current_exp}/${config.user.level_info.next_exp}`
				)
				$.log(`- 升级还需经验: ${config.user.mext_exp}`)
				$.log(
					`- 距离下级还需: ${config.user.next_day}天(登录 观看 分享)`
				)
				$.log(
					`- 距离满级还需: ${Math.max(0, config.user.v6_day)}天(登录 观看 分享)`
				)
				$.log(`- 剩余硬币最多可投: ${Math.floor((config.user.money)/5)}天`)
				$.log(
					"- 距离满级最快还需: " +
					Math.max(0, Math.ceil(config.user.v6_exp / 65)) +
						"天(日常 + 投币*5)"
				)
				return true
			}
		} catch (e) {
			$.logErr(e, response)
		}
	}, reason => {
		$.msg($.name, "- 获取用户信息失败", $.toStr(reason))
		return false
})

}

function dynamic() {
	return new Promise((resolve, reject) => {
		$.log("#### 获取首页视频")
		const myRequest = {
			url: `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?uid=${config.cookie.DedeUserID}&type_list=8&from=&platform=web`,
			headers: {
				"cookie": config.cookieStr
			}
		}
		$.get(myRequest, (err, resp, data) => {
			if (err) reject(err)
			else {
				try {
					const body = $.toObj(data)
					if (body?.data?.cards) {
						cards = body.data.cards
						const { user, watch, share } = config
						user.time = watch.time = share.time = startTime
						$.log("- 获取视频动态成功")
					} else {
						$.log("- 获取视频动态失败")
					}
				} catch (e) {
					$.logErr(e, resp)
				} finally {
					resolve()
				}
			}
		})
	})
}

// Wbi签名获取
function getWbiSigns(r){function t(r){let t="";return e.forEach(s=>{t+=r[s]}),t.slice(0,32)}function s(r,s,u){const e=t(s+u),i=parseInt($.startTime/1e3);let n="";r=Object.assign(r,{wts:i}),n=$.queryStr(Object.fromEntries(new Map(Array.from(Object.entries(r)).sort())));const l=md5(n+e);return n+"&w_rid="+l}function u(){return img_url=config.user.wbi_img.img_url,sub_url=config.user.wbi_img.sub_url,{img_key:img_url.substring(img_url.lastIndexOf("/")+1,img_url.length).split(".")[0],sub_key:sub_url.substring(sub_url.lastIndexOf("/")+1,sub_url.length).split(".")[0]}}const e=[46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52],i=u();return s(r,i.img_key,i.sub_key)}

// md5(32位)
function md5(r){function n(r,n){return r<<n|r>>>32-n}function t(r,n){var t,o,e,u,f;return e=2147483648&r,u=2147483648&n,t=1073741824&r,o=1073741824&n,f=(1073741823&r)+(1073741823&n),t&o?2147483648^f^e^u:t|o?1073741824&f?3221225472^f^e^u:1073741824^f^e^u:f^e^u}function o(r,n,t){return r&n|~r&t}function e(r,n,t){return r&t|n&~t}function u(r,n,t){return r^n^t}function f(r,n,t){return n^(r|~t)}function i(r,e,u,f,i,a,c){return r=t(r,t(t(o(e,u,f),i),c)),t(n(r,a),e)}function a(r,o,u,f,i,a,c){return r=t(r,t(t(e(o,u,f),i),c)),t(n(r,a),o)}function c(r,o,e,f,i,a,c){return r=t(r,t(t(u(o,e,f),i),c)),t(n(r,a),o)}function C(r,o,e,u,i,a,c){return r=t(r,t(t(f(o,e,u),i),c)),t(n(r,a),o)}function g(r){for(var n,t=r.length,o=t+8,e=(o-o%64)/64,u=16*(e+1),f=Array(u-1),i=0,a=0;a<t;)n=(a-a%4)/4,i=a%4*8,f[n]=f[n]|r.charCodeAt(a)<<i,a++;return n=(a-a%4)/4,i=a%4*8,f[n]=f[n]|128<<i,f[u-2]=t<<3,f[u-1]=t>>>29,f}function h(r){var n,t,o="",e="";for(t=0;t<=3;t++)n=r>>>8*t&255,e="0"+n.toString(16),o+=e.slice(-2);return o}function d(r){r=r.replace(/\r\n/g,"\n");for(var n="",t=0;t<r.length;t++){var o=r.charCodeAt(t);o<128?n+=String.fromCharCode(o):o>127&&o<2048?(n+=String.fromCharCode(o>>6|192),n+=String.fromCharCode(63&o|128)):(n+=String.fromCharCode(o>>12|224),n+=String.fromCharCode(o>>6&63|128),n+=String.fromCharCode(63&o|128))}return n}var m,S,v,l,A,s,y,p,w,L=Array(),b=7,j=12,k=17,q=22,x=5,z=9,B=14,D=20,E=4,F=11,G=16,H=23,I=6,J=10,K=15,M=21;for(r=d(r),L=g(r),s=1732584193,y=4023233417,p=2562383102,w=271733878,m=0;m<L.length;m+=16)S=s,v=y,l=p,A=w,s=i(s,y,p,w,L[m+0],b,3614090360),w=i(w,s,y,p,L[m+1],j,3905402710),p=i(p,w,s,y,L[m+2],k,606105819),y=i(y,p,w,s,L[m+3],q,3250441966),s=i(s,y,p,w,L[m+4],b,4118548399),w=i(w,s,y,p,L[m+5],j,1200080426),p=i(p,w,s,y,L[m+6],k,2821735955),y=i(y,p,w,s,L[m+7],q,4249261313),s=i(s,y,p,w,L[m+8],b,1770035416),w=i(w,s,y,p,L[m+9],j,2336552879),p=i(p,w,s,y,L[m+10],k,4294925233),y=i(y,p,w,s,L[m+11],q,2304563134),s=i(s,y,p,w,L[m+12],b,1804603682),w=i(w,s,y,p,L[m+13],j,4254626195),p=i(p,w,s,y,L[m+14],k,2792965006),y=i(y,p,w,s,L[m+15],q,1236535329),s=a(s,y,p,w,L[m+1],x,4129170786),w=a(w,s,y,p,L[m+6],z,3225465664),p=a(p,w,s,y,L[m+11],B,643717713),y=a(y,p,w,s,L[m+0],D,3921069994),s=a(s,y,p,w,L[m+5],x,3593408605),w=a(w,s,y,p,L[m+10],z,38016083),p=a(p,w,s,y,L[m+15],B,3634488961),y=a(y,p,w,s,L[m+4],D,3889429448),s=a(s,y,p,w,L[m+9],x,568446438),w=a(w,s,y,p,L[m+14],z,3275163606),p=a(p,w,s,y,L[m+3],B,4107603335),y=a(y,p,w,s,L[m+8],D,1163531501),s=a(s,y,p,w,L[m+13],x,2850285829),w=a(w,s,y,p,L[m+2],z,4243563512),p=a(p,w,s,y,L[m+7],B,1735328473),y=a(y,p,w,s,L[m+12],D,2368359562),s=c(s,y,p,w,L[m+5],E,4294588738),w=c(w,s,y,p,L[m+8],F,2272392833),p=c(p,w,s,y,L[m+11],G,1839030562),y=c(y,p,w,s,L[m+14],H,4259657740),s=c(s,y,p,w,L[m+1],E,2763975236),w=c(w,s,y,p,L[m+4],F,1272893353),p=c(p,w,s,y,L[m+7],G,4139469664),y=c(y,p,w,s,L[m+10],H,3200236656),s=c(s,y,p,w,L[m+13],E,681279174),w=c(w,s,y,p,L[m+0],F,3936430074),p=c(p,w,s,y,L[m+3],G,3572445317),y=c(y,p,w,s,L[m+6],H,76029189),s=c(s,y,p,w,L[m+9],E,3654602809),w=c(w,s,y,p,L[m+12],F,3873151461),p=c(p,w,s,y,L[m+15],G,530742520),y=c(y,p,w,s,L[m+2],H,3299628645),s=C(s,y,p,w,L[m+0],I,4096336452),w=C(w,s,y,p,L[m+7],J,1126891415),p=C(p,w,s,y,L[m+14],K,2878612391),y=C(y,p,w,s,L[m+5],M,4237533241),s=C(s,y,p,w,L[m+12],I,1700485571),w=C(w,s,y,p,L[m+3],J,2399980690),p=C(p,w,s,y,L[m+10],K,4293915773),y=C(y,p,w,s,L[m+1],M,2240044497),s=C(s,y,p,w,L[m+8],I,1873313359),w=C(w,s,y,p,L[m+15],J,4264355552),p=C(p,w,s,y,L[m+6],K,2734768916),y=C(y,p,w,s,L[m+13],M,1309151649),s=C(s,y,p,w,L[m+4],I,4149444226),w=C(w,s,y,p,L[m+11],J,3174756917),p=C(p,w,s,y,L[m+2],K,718787259),y=C(y,p,w,s,L[m+9],M,3951481745),s=t(s,S),y=t(y,v),p=t(p,l),w=t(w,A);return(h(s)+h(y)+h(p)+h(w)).toLowerCase()}

/***************** Env *****************/
// prettier-ignore
// https://github.com/chavyleung/scripts/blob/master/Env.min.js

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),n=this.getval(a),o=a?"null"===n?null:n||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const n={};this.lodash_set(n,r,t),s=this.setval(JSON.stringify(n),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);default:return this.data&&this.data[e]||null}}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:n,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:n,bodyBytes:o},n,o)},t=>e(t&&t.error||"UndefinedError"))}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:n,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:n,bodyBytes:o},n,o)},t=>e(t&&t.error||"UndefinedError"))}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const n=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t}}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,n(r));break;case"Quantumult X":$notify(e,s,a,n(r))}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e=""){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e,t)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t)}}}(t,e)}
