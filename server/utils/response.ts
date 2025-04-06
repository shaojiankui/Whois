/**
 * 通用返回数据对象，支持链式调用
 */

/**
 * API响应接口定义
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export class ResponseData<T = any> {
  public code: number = 200
  public message: string = ''
  public data: any = null

  /**
   * 设置状态码
   * @param code 状态码
   * @returns this 当前实例，支持链式调用
   */
  public setCode(code: number): ResponseData {
    this.code = code
    return this
  }

  /**
   * 设置消息
   * @param message 消息内容
   * @returns this 当前实例，支持链式调用
   */
  public setMessage(message: string): ResponseData {
    this.message = message
    return this
  }

  /**
   * 设置数据
   * @param data 数据内容
   * @returns this 当前实例，支持链式调用
   */
  public setData(data: any): ResponseData {
    this.data = data
    return this
  }

  /**
   * 重写 toJSON 方法，使对象可以直接被序列化
   * 这样就可以直接返回 ResponseData 实例，无需调用 build()
   */
  public toJSON(): ApiResponse<T> {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    }
  }

  /**
   * 重写 toString 方法
   */
  public toString(): string {
    return JSON.stringify(this.toJSON())
  }

  /**
   * 重写 valueOf 方法
   */
  public valueOf(): ApiResponse<T> {
    return this.toJSON()
  }

  /**
   * 创建成功响应
   * @param data 数据内容
   * @param message 消息内容
   * @returns ResponseData 实例
   */
  public static success(data: any = null, message: string = '操作成功'): ResponseData {
    return new ResponseData().setCode(200).setMessage(message).setData(data)
  }

  /**
   * 创建失败响应
   * @param message 错误消息
   * @param code 错误码
   * @returns ResponseData 实例
   */
  public static error(message: string = '操作失败', code: number = 500): ResponseData {
    return new ResponseData().setCode(code).setMessage(message).setData(null)
  }
}
