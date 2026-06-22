import process from "node:process";
import {
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

const getHexApiUrl = (path) => {
  const apiBase = getRequiredEnv("VITE_API_BASE").replace(/\/$/, "");
  const apiPath = getRequiredEnv("VITE_API_PATH");

  return (
    `${apiBase}/api/${encodeURIComponent(apiPath)}` +
    `/${path}`
  );
};

const getOrder = async (orderId) => {
  const response = await fetch(
    getHexApiUrl(`order/${encodeURIComponent(orderId)}`),
  );

  const result = await response.json();

  if (!response.ok || !result.success || !result.order) {
    return null;
  }

  return result.order;
};

const markOrderAsPaid = async (orderId) => {
  const response = await fetch(
    getHexApiUrl(`pay/${encodeURIComponent(orderId)}`),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "更新訂單付款狀態失敗");
  }

  return result;
};

const sendCallbackResponse = (response, message) => {
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");

  return response.status(200).send(message);
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");

    return response.status(405).send("Method Not Allowed");
  }

  try {
    const parameters = await parseFormBody(request);

    if (!verifyCheckMacValue(parameters)) {
      console.error("綠界 callback 檢查碼驗證失敗");

      return sendCallbackResponse(response, "0|CheckMacValue Error");
    }

    const merchantId = getRequiredEnv("ECPAY_MERCHANT_ID");

    if (String(parameters.MerchantID) !== merchantId) {
      console.error("綠界 callback MerchantID 不符");

      return sendCallbackResponse(response, "0|Merchant Error");
    }

    /*
     * RtnCode 不等於 1 代表付款未成功。
     * 這種通知已正確收到，因此回覆 1|OK，但不更新訂單。
     */
    if (String(parameters.RtnCode) !== "1") {
      console.warn(
        "綠界付款未成功：",
        parameters.MerchantTradeNo,
        parameters.RtnCode,
        parameters.RtnMsg,
      );

      return sendCallbackResponse(response, "1|OK");
    }

    const orderId = String(parameters.CustomField1 ?? "").trim();

    if (!/^[A-Za-z0-9_-]{1,50}$/.test(orderId)) {
      console.error("綠界 callback 缺少有效的六角訂單 ID");

      return sendCallbackResponse(response, "0|Order Error");
    }

    const order = await getOrder(orderId);

    if (!order) {
      console.error("綠界 callback 找不到六角訂單");

      return sendCallbackResponse(response, "0|Order Not Found");
    }

    /*
     * 綠界可能重複發送 callback。
     * 訂單已付款時直接回覆成功，不重複呼叫付款 API。
     */
    if (order.is_paid) {
      return sendCallbackResponse(response, "1|OK");
    }

    const orderAmount = Number(order.total);
    const ecpayAmount = Number(parameters.TradeAmt);

    if (
      !Number.isInteger(orderAmount) ||
      !Number.isInteger(ecpayAmount) ||
      orderAmount <= 0 ||
      orderAmount !== ecpayAmount
    ) {
      console.error("綠界 callback 訂單金額不符");

      return sendCallbackResponse(response, "0|Amount Error");
    }

    await markOrderAsPaid(orderId);

    console.log(
      "綠界測試付款成功：",
      parameters.MerchantTradeNo,
      orderId,
    );

    return sendCallbackResponse(response, "1|OK");
  } catch (error) {
    console.error(
      "處理綠界 callback 失敗：",
      error instanceof Error ? error.message : "Unknown error",
    );

    return sendCallbackResponse(response, "0|Error");
  }
}