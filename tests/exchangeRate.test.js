import test from "node:test";
import assert from "node:assert/strict";
import {
  convertJpyToTwd,
  parseJpyRate,
} from "../api/utils/exchangeRate.js";

const sampleCsv = [
  "幣別,匯率,現金,即期",
  "USD,本行買入,31.20000,31.55000",
  "JPY,本行買入,0.18630,0.19360,0.19360,0.19370,0.19380,0.19390,0.19400,0.19410,0.19420,本行賣出,0.19910,0.19760",
].join("\n");

test("解析臺銀日圓即期賣出匯率", () => {
  const rate = parseJpyRate(sampleCsv);

  assert.equal(rate, 0.1976);
});

test("能處理 CSV 開頭的 BOM 字元", () => {
  const rate = parseJpyRate(`\uFEFF${sampleCsv}`);

  assert.equal(rate, 0.1976);
});

test("將 5200 日圓四捨五入換算成 1028 台幣", () => {
  const amount = convertJpyToTwd(5200, 0.1976);

  assert.equal(amount, 1028);
});

test("找不到日圓資料時拋出錯誤", () => {
  assert.throws(
    () => parseJpyRate("USD,本行買入,31.2"),
    /找不到臺灣銀行日圓匯率/,
  );
});

test("拒絕無效的金額與匯率", () => {
  assert.throws(() => convertJpyToTwd(0, 0.1976));
  assert.throws(() => convertJpyToTwd(5200, 0));
});