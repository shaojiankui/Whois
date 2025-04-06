import { ResponseData } from '../utils/response'
export default defineNitroPlugin((nitroApp) => {
  // 将 ResponseData 添加到全局变量中
  ;(globalThis as any).ResponseData = ResponseData
  // globalThis.ResponseData = ResponseData
})
