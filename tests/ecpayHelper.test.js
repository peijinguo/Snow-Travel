import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import {
  createEcpayClient,
  generateMerchantTradeNo,
  getEcpayOptions,
  getEcpaySiteUrl,
  verifyCheckMacValue,
} from "../api/utils/ecpayHelper.js";

const environmentNames = [
  "ECPAY_MODE",
  "ECPAY_MERCHANT_ID",
  "ECPAY_HASH_KEY",
  "ECPAY_HASH_IV",
  "ECPAY_SITE_URL",
];

const originalEnvironment = Object.fromEntries(
  environmentNames.map((name) => [name, process.env[name]]),
);

const testEnvironment = {
  ECPAY_MODE: "Test",
  ECPAY_MERCHANT_ID: "9999999",
  ECPAY_HASH_KEY: "TESTHASHKEY12345",
  ECPAY_HASH_IV: "TESTHASHIV123456",
  ECPAY_SITE_URL: "https://snow-travel.vercel.app",
};

beforeEach(() => {
  Object.assign(process.env, testEnvironment);
});

after(() => {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test("建立綠界測試環境設定", () => {
  const options = getEcpayOptions();

  assert.equal(options.OperationMode, "Test");
  assert.equal(options.MercProfile.MerchantID, "9999999");
  assert.equal(options.IsProjectContractor, false);
});

test("建立綠界 SDK client", () => {
  const client = createEcpayClient();

  assert.ok(client.payment_client);
  assert.ok(client.payment_client.helper);
});

test("產生符合規格的交易編號", () => {
  const tradeNumber = generateMerchantTradeNo();

  assert.match(tradeNumber, /^[A-Z0-9]+$/);
  assert.ok(tradeNumber.length <= 20);
  assert.ok(tradeNumber.startsWith("ST"));
});

test("每次產生不同的交易編號", () => {
  const tradeNumbers = new Set(
    Array.from({ length: 20 }, () => generateMerchantTradeNo()),
  );

  assert.equal(tradeNumbers.size, 20);
});

test("取得正式 HTTPS 網址", () => {
  assert.equal(getEcpaySiteUrl(), "https://snow-travel.vercel.app");
});

test("通過綠界官方 CheckMacValue 範例", () => {
  const parameters = {
    MerchantID: "9999999",
    MerchantTradeNo: "TEST202606210001",
    MerchantTradeDate: "2026/06/21 12:00:00",
    PaymentType: "aio",
    TotalAmount: "1000",
    TradeDesc: "Snow Travel Test",
    ItemName: "Test Product",
    ReturnURL: "https://example.com/callback",
    ChoosePayment: "Credit",
    EncryptType: "1",
    CheckMacValue:
      "01003003CF89F34C1A3E3D41B56B1DE4E896E4D9645AF286FB0FC4D02D0D8BC5",
  };

  assert.equal(verifyCheckMacValue(parameters), true);
});

test("拒絕錯誤的 CheckMacValue", () => {
  const parameters = {
    MerchantID: "9999999",
    TotalAmount: "100",
    CheckMacValue: "A".repeat(64),
  };

  assert.equal(verifyCheckMacValue(parameters), false);
});

test("缺少環境變數時顯示明確錯誤", () => {
  delete process.env.ECPAY_HASH_KEY;

  assert.throws(() => getEcpayOptions(), /ECPAY_HASH_KEY/);
});
