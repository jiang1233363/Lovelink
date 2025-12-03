// 日期工具函数

export class DateHelper {
  // 格式化日期
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  // 获取今天日期字符串
  static today(): string {
    return this.format(new Date(), 'YYYY-MM-DD');
  }

  // 获取昨天日期
  static yesterday(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return this.format(date, 'YYYY-MM-DD');
  }

  // 获取明天日期
  static tomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return this.format(date, 'YYYY-MM-DD');
  }

  // 计算两个日期之间的天数
  static daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 添加天数
  static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // 获取本月第一天
  static firstDayOfMonth(date?: Date): Date {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  // 获取本月最后一天
  static lastDayOfMonth(date?: Date): Date {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  // 判断是否是今天
  static isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  }

  // 相对时间描述
  static relative(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return this.format(d, 'YYYY-MM-DD');
    }
  }
}















