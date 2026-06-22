import process from "node:process";
import {
  createEcpayClient,
  generateMerchantTradeNo,
  getEcpaySiteUrl,
  parseFormBody,
} from "../utils/ecpayHelper.js";

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`缺少環境變數：${name}`);
  }

  return value;
};

const formatTaipeiDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return (
    `${values.year}/${values.month}/${values.day} ` +
    `${values.hour}:${values.minute}:${values.second}`
  );
};

const getOrder = async (orderId) => {
  const apiBase = getRequiredEnv("VITE_API_BASE").replace(/\/$/, "");
  const apiPath = getRequiredEnv("VITE_API_PATH");

  const url =
    `${apiBase}/api/${encodeURIComponent(apiPath)}` +
    `/order/${encodeURIComponent(orderId)}`;

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success || !result.order) {
    return null;
  }

  return result.order;
};

const renderPaymentPage = (paymentForm) => {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>前往綠界付款</title>
  </head>
  <body>
    <p>正在前往綠界測試付款頁面，請稍候……</p>
    ${paymentForm}
  </body>
</html>`;
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");

    return response.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  try {
    const body = await parseFormBody(request);
    const orderId = String(body.orderId ?? "").trim();

    if (!/^[A-Za-z0-9_-]{1,50}$/.test(orderId)) {
      return response.status(400).json({
        success: false,
        message: "訂單編號格式錯誤",
      });
    }

    const order = await getOrder(orderId);

    if (!order) {
      return response.status(404).json({
        success: false,
        message: "找不到訂單",
      });
    }

    if (order.is_paid) {
      return response.status(409).json({
        success: false,
        message: "此訂單已付款",
      });
    }

    const totalAmount = Number(order.total);

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      return response.status(400).json({
        success: false,
        message: "訂單金額不正確",
      });
    }

    const siteUrl = getEcpaySiteUrl();

    const paymentParameters = {
      MerchantTradeNo: generateMerchantTradeNo(),
      MerchantTradeDate: formatTaipeiDate(),
      TotalAmount: String(totalAmount),
      TradeDesc: "Snow Travel 測試訂單",
      ItemName: "Snow Travel 雪地旅遊行程",
      ReturnURL: `${siteUrl}/api/ecpay/callback`,   //是綠界通知後端付款結果的位置
      OrderResultURL: `${siteUrl}/api/ecpay/result`,    //是付款後將瀏覽器帶回網站的位置
      ClientBackURL: `${siteUrl}/#/checkout-success/${orderId}`,
      CustomField1: orderId,    //保存六角訂單 ID
    };

    const client = createEcpayClient();

    const paymentForm =
      client.payment_client.aio_check_out_credit_onetime(
        paymentParameters,
      );

    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");

    return response
      .status(200)
      .send(renderPaymentPage(paymentForm));
  } catch (error) {
    console.error(
      "建立綠界付款失敗：",
      error instanceof Error ? error.message : "Unknown error",
    );

    return response.status(500).json({
      success: false,
      message: "建立付款頁面失敗",
    });
  }
}