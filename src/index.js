// 引入封装的axios实例request
const { request } =  require('./http/index')

// 导入要用到的api
const { api } = require('./api/index')

/**
 * 查询今天是否已经签到
 *
 * @return {Boolean} 是否签到过
 */
const getCheckStatus = async () => {
  try {
    const { data : isCheckInToday } = await request({ url: api.getCheckStatus})
    // 打印日志
    console.log(`>>>>查询今天是否已经签到:${isCheckInToday}✍️`);
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
    console.log(`>>>>当前总矿石数: ${data}💎`)
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
    console.log(`>>>>查询免费抽奖次数: ${data.free_count}🎟`);
    return data.free_count === 0
  } catch (error) {
    throw `查询免费抽奖失败！【${error}】`
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
    const { history_id } = data.lotteries[random]
    // 打印日志
    console.log(`>>>>被沾的幸运儿的history_id: ${history_id}💃`);
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
    console.log(`>>>>沾喜气成功! 【当前幸运值：${data.total_value}/6000】🎉 `)
  } catch (error) {
    throw `占喜气失败！ ${error}`
  }
}
