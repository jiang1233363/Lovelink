// 统一响应格式

export class ResponseHelper {
  // 成功响应
  static success(data?: any, message: string = '操作成功') {
    return {
      code: 200,
      message,
      data
    };
  }

  // 失败响应
  static error(message: string = '操作失败', code: number = 500) {
    return {
      code,
      message
    };
  }

  // 参数错误
  static badRequest(message: string = '参数错误', errors?: any[]) {
    return {
      code: 400,
      message,
      errors
    };
  }

  // 未授权
  static unauthorized(message: string = '未授权访问') {
    return {
      code: 401,
      message
    };
  }

  // 禁止访问
  static forbidden(message: string = '无权访问') {
    return {
      code: 403,
      message
    };
  }

  // 未找到
  static notFound(message: string = '资源不存在') {
    return {
      code: 404,
      message
    };
  }

  // 服务器错误
  static serverError(message: string = '服务器错误') {
    return {
      code: 500,
      message
    };
  }
}

// Express响应扩展
export function extendResponse(res: any) {
  res.success = (data?: any, message?: string) => {
    return res.json(ResponseHelper.success(data, message));
  };

  res.error = (message?: string, code?: number) => {
    return res.json(ResponseHelper.error(message, code));
  };

  res.badRequest = (message?: string, errors?: any[]) => {
    return res.json(ResponseHelper.badRequest(message, errors));
  };

  res.unauthorized = (message?: string) => {
    return res.json(ResponseHelper.unauthorized(message));
  };

  res.forbidden = (message?: string) => {
    return res.json(ResponseHelper.forbidden(message));
  };

  res.notFound = (message?: string) => {
    return res.json(ResponseHelper.notFound(message));
  };

  res.serverError = (message?: string) => {
    return res.json(ResponseHelper.serverError(message));
  };

  return res;
}















