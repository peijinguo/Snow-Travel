import process from "node:process";
import {
  getEcpaySiteUrl,
  parseFormBody,
  verifyCheckMacValue,
} from "../utils/ecpayHelper.js";

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`缺少環境變數：${name}`);
  }

  return value;
};

const sendErrorPage = (response, statusCode, message) => {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");

  return response.status(statusCode).send(`<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>付款結果發生錯誤</title>
  </head>
  <body>
    <h1>無法確認付款結果</h1>
    <p>${message}</p>
    <a href="/">返回 Snow Travel</a>
  </body>
</html>`);
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");

    return sendErrorPage(
      response,
      405,
      "此頁面只能由綠界付款頁面進入。",
    );
  }

  try {
    const parameters = await parseFormBody(request);

    if (!verifyCheckMacValue(parameters)) {
      console.error("綠界 result 檢查碼驗證失敗");

      return sendErrorPage(
        response,
        400,
        "付款資料驗證失敗，請返回網站查詢訂單狀態。",
      );
    }

    const merchantId = getRequiredEnv("ECPAY_MERCHANT_ID");

    if (String(parameters.MerchantID) !== merchantId) {
      console.error("綠界 result MerchantID 不符");

      return sendErrorPage(
        response,
        400,
        "付款商店資料不符，請返回網站查詢訂單狀態。",
      );
    }

    const orderId = String(parameters.CustomField1 ?? "").trim();

    if (!/^[A-Za-z0-9_-]{1,50}$/.test(orderId)) {
      console.error("綠界 result 缺少有效的六角訂單 ID");

      return sendErrorPage(
        response,
        400,
        "找不到對應的訂單，請返回網站重新確認。",
      );
    }

    /*
     * result 只負責導頁，不能在這裡直接判定已付款。
     * 真正付款狀態仍由 callback 更新。
     */
    const paymentResult =
      String(parameters.RtnCode) === "1"
        ? "processing"
        : "failed";

    const siteUrl = getEcpaySiteUrl();

    const redirectUrl =
      `${siteUrl}/#/checkout-success/` +
      `${encodeURIComponent(orderId)}` +
      `?payment=${paymentResult}`;

    response.setHeader("Location", redirectUrl);
    response.setHeader("Cache-Control", "no-store");

    return response.status(303).end();
  } catch (error) {
    console.error(
      "處理綠界 result 失敗：",
      error instanceof Error ? error.message : "Unknown error",
    );

    return sendErrorPage(
      response,
      500,
      "系統暫時無法處理付款結果，請稍後再試。",
    );
  }
}