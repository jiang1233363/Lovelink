// 数据验证工具

export class Validator {
  // 验证邮箱
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号
  static isPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证密码强度
  static isStrongPassword(password: string): { valid: boolean; message: string } {
    if (password.length < 6) {
      return { valid: false, message: '密码至少6个字符' };
    }
    if (password.length > 20) {
      return { valid: false, message: '密码最多20个字符' };
    }
    return { valid: true, message: '密码符合要求' };
  }

  // 验证日期格式
  static isDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  // 验证金额
  static isAmount(amount: any): boolean {
    const num = Number(amount);
    return !isNaN(num) && num > 0 && num < 1000000;
  }

  // 验证字符串长度
  static isLength(str: string, min: number, max: number): boolean {
    const len = str.trim().length;
    return len >= min && len <= max;
  }

  // 验证是否为空
  static isNotEmpty(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  // 验证枚举值
  static isInEnum(value: any, enumValues: any[]): boolean {
    return enumValues.includes(value);
  }
}

// 验证中间件生成器
export function validateRequest(schema: any) {
  return (req: any, res: any, next: any) => {
    const errors: string[] = [];

    // 验证必填字段
    if (schema.required) {
      for (const field of schema.required) {
        if (!Validator.isNotEmpty(req.body[field])) {
          errors.push(`${field}不能为空`);
        }
      }
    }

    // 验证字段规则
    if (schema.fields) {
      for (const [field, rules] of Object.entries(schema.fields) as any) {
        const value = req.body[field];
        
        if (rules.email && !Validator.isEmail(value)) {
          errors.push(`${field}格式不正确`);
        }
        
        if (rules.phone && !Validator.isPhone(value)) {
          errors.push(`${field}格式不正确`);
        }
        
        if (rules.min && rules.max && !Validator.isLength(value, rules.min, rules.max)) {
          errors.push(`${field}长度应在${rules.min}-${rules.max}之间`);
        }
        
        if (rules.enum && !Validator.isInEnum(value, rules.enum)) {
          errors.push(`${field}值不合法`);
        }
        
        if (rules.date && !Validator.isDate(value)) {
          errors.push(`${field}日期格式不正确`);
        }
        
        if (rules.amount && !Validator.isAmount(value)) {
          errors.push(`${field}金额不正确`);
        }
      }
    }

    if (errors.length > 0) {
      return res.json({
        code: 400,
        message: '数据验证失败',
        errors
      });
    }

    next();
  };
}















