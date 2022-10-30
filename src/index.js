// 引入封装的axios实例request
const { request } =  require('./http/index')

// 导入要用到的api
const { api } = require('./api/index')

// Nodemailer是一个简单易用的Node.js邮件发送组件
const nodeMailer = require('nodemailer');

// 引入邮箱配置
const { email } = require('./config') 

// EJS是后台模板，可以把数据库和文件中读取的数据显示到html上
const ejs = require('ejs')

// node核心模块之一，具备读写本地文件的能力
const fs = require('fs')

// path是用于处理文件路径的模块
const path = require('path')

// Day.js是一个极简的JavaScript库，可以为现代浏览器解析、验证、操作和显示日期和时间
const dayjs = require('dayjs')

/**
 * 查询今天是否已经签到
 *
 * @return {Boolean} 是否签到过
 */
const getCheckStatus = async () => {
  try {
    const { data : isCheckInToday } = await request({ url: api.getCheckStatus})
    // 打印日志
    console.log(`✍️ 今天${isCheckInToday?'已经完成':'尚未进行'}签到 ✍️`);
    return isCheckInToday
  } catch (error) {
    throw `查询签到失败!【${error}】`
  }
}

/**
 * 查询当前矿石
 */
const getCurrentPoint = async () => {
  try {
    const { data } = await request({ url: api.getCurrentPoint})
    // 打印日志
    console.log(`💎 当前拥有矿石${data}枚 💎`)
  } catch (error) {
    throw `查询矿石失败!${error.err_msg}`
  }
}

/**
 * 查询免费抽奖次数
 * @return {Boolean} 是否有免费抽奖次数
 */
const getlotteryStatus = async () => {
  try {
    const { data } = await request({ url: api.getlotteryStatus})
    // 打印日志
    console.log(`🎟 剩余免费抽奖${data.free_count}次 🎟`);
    return data.free_count 
  } catch (error) {
    throw `查询免费抽奖失败！【${error}】`
  }
}

/**
 * 抽奖
 */
const draw = async () => {
  try {
    // 获取免费次数
    const freeCount = await getlotteryStatus()
    if (freeCount > 0) {
      // 开始抽奖
      const drawRes = await request({ url: api.draw, method: 'post' })
      console.log(`🎉 恭喜抽到【${drawRes.data.lottery_name}】🎉`)
    } else {
      console.log(` 👉👉👉 抽奖任务终止成功 👈👈👈`)
    }
  } catch (error) {
    console.error(`抽奖失败!=======> 【${error}】`)
  }
}

/**
 * 获取沾喜气列表用户historyId
 *
 * @return {string} 被沾的幸运儿的history_id
 */
const getLuckyUserHistoryId = async () => {
  try {
    // 接口为分页查询  默认查询条10条数据 {page_no: 0, page_size: 5}
    const { data } = await request({ url: api.getLuckyUserList , method: 'post'})
    // 生成随机数，用于随机抽取一位被粘用户
    const random = Math.floor(Math.random() * data.lotteries.length ) 
    // // 获取这位幸运用户的history_id
    const { history_id ,user_name} = data.lotteries[random]
    // 打印日志
    console.log(`💃 本次被沾的幸运儿是「${user_name}」 💃`);
    return history_id
  } catch (error) {
    throw `获取沾喜气列表用户historyId失败`
  }
}

/**
 * 沾喜气
 */
const dipLucky = async () => {
  try {
    // 获取historyId
    const historyId = await getLuckyUserHistoryId()
    // 沾喜气接口   传递lottery_history_id
    const { data } = await request({ url: api.dipLucky, method: 'post', data: { lottery_history_id: historyId } })
    // 打印日志
    console.log(`🎉 沾喜气成功,当前幸运值：${data.total_value}/6000 🎉`)
  } catch (error) {
    throw `占喜气失败！ ${error}`
  }
}

/**
 * 查询签到天数
 * @return {Object} continuousDay 连续签到天数 sumCount 总签到天数
 */
const getCheckInDays = async () => {
  try {
    const { data } = await request({ url: api.getCheckInDays})
    // 打印日志
    console.log(`🌞『连续签到天数：${data.cont_count}天』『累计签到天数：${data.sum_count}天』🌞`)
    return { contCount: data.cont_count, sumCount: data.sum_count }
  } catch (error) {
    throw `查询签到天数失败!`
  }
}


/**
 * 签到
 */
const checkIn = async () => {
  try {
    // 先判断今天是否已经签到
    const checkStatusRes = await getCheckStatus()
    if (checkStatusRes){
      console.log("👉👉👉 签到任务终止成功 👈👈👈");
    } else {
      // 执行签到程序
      const { data : checkInRes } = await request({ url: api.checkIn, method: 'post' })
      // 打印日志
      console.log(`✅ 签到成功,本次获得${checkInRes.incr_point}矿石，总矿石${checkInRes.sum_point}`)
    }
  } catch (error) {
    console.error(`❗️签到失败!>>>>>>${error}`)
  }
}

/**
 * 发送邮件
 */
const sendEmail = async () => {
  try {
    // ejs.compile(str, options) 输出渲染后的 HTML 字符串
    const template = ejs.compile(fs.readFileSync(path.resolve(__dirname, 'email.ejs'), 'utf8'));
    const {service,user,pass,from,to} = email
    const transporter = nodeMailer.createTransport({ service, auth: { user, pass}})
    // 发送邮件
    const todayStr = '请查收'+ dayjs().format('YYYY年MM月DD日') + '签到日志' 
    await transporter.sendMail({ from, to, subject: '🔔掘金签到通知', html: template({ logs: logs ,title:todayStr})})
    //打印日志
    console.log(`📨邮件发送成功!`);
  } catch (error) {
    console.error(`邮件发送失败！${error}`)
  }
}

let logs = []
/**
 * 启动程序  处理日志输出 开始签到流程 将结果通过邮件形式发送
 *
 */
const start = async () => {
  // 日志处理  将脚本日志通过ejs渲染成html
  console.oldLog = console.log
  console.oldErr = console.error

  console.log = (str) => {
    logs.push({
      type: 'success',
      text: str
    })
    console.oldLog(str)
  }

  console.error = (str) => {
    logs.push({
      type: 'error',
      text: str
    })
    console.oldErr(str)
  }
 
  try {
    // 签到 
    await checkIn()
    // 抽奖
    await draw()
    // 沾喜气
    await dipLucky()
    // 当前矿石数量
    await getCurrentPoint()
    // 当前签到数据
    await getCheckInDays()
    // 发送邮件
    await sendEmail()
    return true
  } catch (error) {
    console.log(error);
    return false
  }
}

// start()

const sendEmail1 = async () => {
  try {
    const {service,user,pass,from,to} = email
    const transporter = nodeMailer.createTransport({ service, auth: { user, pass}})
    // 发送邮件
    await transporter.sendMail({ from, to, subject: '邮件发送测试', html: '这是一封神秘的邮件，用于测试。'})
    //打印日志
    console.log(`📨邮件发送成功!`);
  } catch (error) {
    console.error(`邮件发送失败！${error}`)
  }
}
sendEmail1()