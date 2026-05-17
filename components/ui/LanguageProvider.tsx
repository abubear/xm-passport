'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh-CN' | 'zh-TW';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  'zh-CN': '简',
  'zh-TW': '繁',
};

// Core UI translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    vault: 'Vault',
    scan: 'Scan',
    market: 'Market',
    profile: 'Profile',
    points: 'Points',
    rank: 'Rank',
    cards: 'Cards',
    collected: 'Collected',
    journeys: 'Journeys',
    welcome: 'Welcome back',
    edit_profile: 'Edit Profile',
    sign_out: 'Sign Out',
    save: 'Save',
    cancel: 'Cancel',
    bio: 'Bio',
    location: 'Location',
    preferences: 'Collection Preferences',
    privacy: 'Privacy',
    public_profile: 'Public Profile',
    language: 'Language',
    verified: 'Verified',
    create_passport: 'Create Passport',
    sign_in: 'Sign In',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    display_name: 'Display Name',
    scan_card: 'Scan Card',
    no_cards: 'No cards yet',
    no_listings: 'No listings yet',
    buy_now: 'Buy Now',
    create_listing: 'Create Listing',
    redeem: 'Redeem',
    drops: 'Drops',
    redeem_now: 'Redeem Now',
    payment_required: 'Payment Required',
    reserved: 'Reserved',
    paid: 'Paid',
    active: 'Active',
    redeemed: 'Redeemed',
  },
  'zh-CN': {
    home: '首页',
    vault: '收藏库',
    scan: '扫描',
    market: '市场',
    profile: '个人',
    points: '积分',
    rank: '等级',
    cards: '卡牌',
    collected: '已收集',
    journeys: '旅程',
    welcome: '欢迎回来',
    edit_profile: '编辑资料',
    sign_out: '退出',
    save: '保存',
    cancel: '取消',
    bio: '简介',
    location: '地区',
    preferences: '收藏偏好',
    privacy: '隐私',
    public_profile: '公开资料',
    language: '语言',
    verified: '已验证',
    create_passport: '创建通行证',
    sign_in: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    phone: '手机号',
    display_name: '显示名称',
    scan_card: '扫描卡牌',
    no_cards: '暂无卡牌',
    no_listings: '暂无列表',
    buy_now: '立即购买',
    create_listing: '创建列表',
    redeem: '兑换',
    drops: '新品',
    redeem_now: '立即兑换',
    payment_required: '需付款',
    reserved: '已预留',
    paid: '已付款',
    active: '可用',
    redeemed: '已兑换',
  },
  'zh-TW': {
    home: '首頁',
    vault: '收藏庫',
    scan: '掃描',
    market: '市場',
    profile: '個人',
    points: '積分',
    rank: '等級',
    cards: '卡牌',
    collected: '已收集',
    journeys: '旅程',
    welcome: '歡迎回來',
    edit_profile: '編輯資料',
    sign_out: '退出',
    save: '儲存',
    cancel: '取消',
    bio: '簡介',
    location: '地區',
    preferences: '收藏偏好',
    privacy: '隱私',
    public_profile: '公開資料',
    language: '語言',
    verified: '已驗證',
    create_passport: '建立通行證',
    sign_in: '登入',
    register: '註冊',
    email: '郵箱',
    password: '密碼',
    phone: '手機號',
    display_name: '顯示名稱',
    scan_card: '掃描卡牌',
    no_cards: '暫無卡牌',
    no_listings: '暫無列表',
    buy_now: '立即購買',
    create_listing: '建立列表',
    redeem: '兌換',
    drops: '新品',
    redeem_now: '立即兌換',
    payment_required: '需付款',
    reserved: '已預留',
    paid: '已付款',
    active: '可用',
    redeemed: '已兌換',
  },
};

export { LANGUAGE_NAMES, LANGUAGE_LABELS, translations };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language from profile on mount
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.language && ['en', 'zh-CN', 'zh-TW'].includes(data.user.language)) {
          setLanguage(data.user.language as Language);
        }
      })
      .catch(() => {});
  }, []);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
