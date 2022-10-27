const axios = require('axios');
const { baseURL } = require('../api/index')
const { cookie } = require('../config')
// 创建axios实例，并配置相关参数
const request = axios.create({
  baseURL,
  method:'get',
  timeout:3000,
  headers:{ cookie }
})

// 响应拦截处理
request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.err_msg === 'success' && data.err_no === 0) {
      return data
    } else {
      return Promise.reject(data.err_msg)
    }
  }, 
  (error) => {
    return Promise.reject(error)
  }
)

module.exports = { request }
