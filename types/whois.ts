// WHOIS 数据类型定义

// WHOIS 原始数据接口
export interface WhoisRawData {
  domainName: string;
  rawText?: string;
  statusCode: number;
  error?: string;
  formatted?: WhoisFormatted;
  data?: WhoisData;
}

// WHOIS 格式化数据接口
export interface WhoisFormatted {
  key: string;
  domain?: {
    domain: string;
    registry_domain_id?: string;
    created_date?: string;
    updated_date?: string;
    expired_date?: string;
    name_servers?: string[];
    status?: string[];
    dnssec?: string;
  };
  registrar?: {
    key: string;
    registrar_name?: string;
    registrar_ianaid?: string;
    referral_url?: string;
    whois_server?: string;
  };
  registrant?: WhoisContact;
  administrative?: WhoisContact;
  technical?: WhoisContact;
  billing?: WhoisContact;
}

// WHOIS 联系人接口
export interface WhoisContact {
  key: string;
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// WHOIS 处理后的数据接口
export interface WhoisData {
  domainName: string;
  isAvailable?: boolean;
  reserved?: boolean;
  premium?: boolean;
  registrar?: string;
  whoisServer?: string;
  creationDate?: string;
  updatedDate?: string;
  expiryDate?: string;
  nameServers?: string[];
  status?: string[];
  dnssec?: string;
  registrantName?: string;
  registrantOrganization?: string;
  registrantEmail?: string;
  rawText?: string;
  domainId?: string;
  tags?: WhoisTag[];
  price?: {
    registration?: number;
    renewal?: number;
    currency?: string;
  };
}

// WHOIS 标签接口
export interface WhoisTag {
  type: string;
  label: string;
  class: string;
  description?: string;
}

// WhoisDisplay 组件数据接口
export interface WhoisDisplayData {
  expirationDate?: string;
  updatedDate?: string;
  creationDate?: string;
  domainStatus?: Record<string, string>;
  sponsoringRegistrar?: string;
  registrarIANAID?: string | number;
  registryDomainID?: string;
  nameServers?: string[];
  dnssec?: string;
  hasMoreInfo?: boolean;
  registrant?: WhoisContact;
  tags?: WhoisTag[];
} 