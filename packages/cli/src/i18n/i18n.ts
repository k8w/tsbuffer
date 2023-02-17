import { i18n as zhCN } from './zh-cn';
import { i18n as enUS } from './en-us';
import osLocale from "os-locale";

// 根据系统语言判断中英文
export const i18n = osLocale.sync() === 'zh-CN' ? zhCN : enUS;