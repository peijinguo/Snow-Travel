import ECPayPayment from "ecpay_aio_nodejs";
import crypto from "node:crypto";
import process from "node:process";
import { Buffer } from "node:buffer";

//缺少金流設定時立即報錯
const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`缺少環境變數：${name}`);
  }

  return value;
};

export const getEcpayOptions = () => ({
  OperationMode:
    process.env.ECPAY_MODE === "Production" ? "Production" : "Test",
  MercProfile: {
    MerchantID: getRequiredEnv("ECPAY_MERCHANT_ID"),
    HashKey: getRequiredEnv("ECPAY_HASH_KEY"),
    HashIV: getRequiredEnv("ECPAY_HASH_IV"),
  },
  IgnorePayment: [],
  IsProjectContractor: false,
});

const encodeForEcpay = (value) => {
  return encodeURIComponent(value)
    .toLowerCase()
    .replace(/'/g, "%27")
    .replace(/~/g, "%7e")
    .replace(/%20/g, "+");
};

export const generateCheckMacValue = (parameters) => {
  const forbiddenNames = ["CheckMacValue", "HashKey", "HashIV"];

  for (const name of forbiddenNames) {
    if (Object.hasOwn(parameters, name)) {
      throw new Error(`計算檢查碼時不可包含 ${name}`);
    }
  }

  const sortedParameters = Object.entries(parameters)
    .sort(([firstKey], [secondKey]) =>
      firstKey.toLowerCase().localeCompare(secondKey.toLowerCase()),
    )
    .map(([key, value]) => `${key}=${String(value ?? "")}`)
    .join("&");

  const hashKey = getRequiredEnv("ECPAY_HASH_KEY");
  const hashIV = getRequiredEnv("ECPAY_HASH_IV");

  const rawValue =
    `HashKey=${hashKey}&${sortedParameters}&HashIV=${hashIV}`;

  const encodedValue = encodeForEcpay(rawValue);

  return crypto
    .createHash("sha256")
    .update(encodedValue)
    .digest("hex")
    .toUpperCase();
};

export const createEcpayClient = () => {
  const client = new ECPayPayment(getEcpayOptions());

  // 官方 SDK 會將含金鑰的簽章原文印到 console。
  // 改用不輸出敏感資料的簽章函式。
  client.payment_client.helper.gen_chk_mac_value = (parameters) =>
    generateCheckMacValue(parameters);

  return client;
};






//產生最多 20 字元的綠界交易編號
export const generateMerchantTradeNo = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `ST${timestamp}${random}`.slice(0, 20);
};

//取得公開的 Vercel HTTPS 網址
export const getEcpaySiteUrl = () => {
  const siteUrl = getRequiredEnv("ECPAY_SITE_URL");
  const url = new URL(siteUrl);

  if (url.protocol !== "https:") {
    throw new Error("ECPAY_SITE_URL 必須使用 HTTPS");
  }

  return url.origin;
};

//解析綠界送來的 POST 表單
export const parseFormBody = async (request) => {
  if (
    request.body &&
    typeof request.body === "object" &&
    !Buffer.isBuffer(request.body)
  ) {
    return request.body;
  }

  let rawBody;

  if (typeof request.body === "string") {
    rawBody = request.body;
  } else if (Buffer.isBuffer(request.body)) {
    rawBody = request.body.toString("utf8");
  } else {
    const chunks = [];

    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    rawBody = Buffer.concat(chunks).toString("utf8");
  }

  return Object.fromEntries(new URLSearchParams(rawBody));
};

//確認付款結果沒有被偽造
export const verifyCheckMacValue = (parameters) => {
  const receivedCheckMacValue = parameters.CheckMacValue;

  if (!receivedCheckMacValue) {
    return false;
  }

  const payload = { ...parameters };
  delete payload.CheckMacValue;

  
  const calculatedCheckMacValue = generateCheckMacValue(payload);

  const received = Buffer.from(receivedCheckMacValue.toUpperCase());
  const calculated = Buffer.from(calculatedCheckMacValue.toUpperCase());

  if (received.length !== calculated.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, calculated);
};
