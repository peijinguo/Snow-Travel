import { fetchJpyToTwdRate } from "./utils/exchangeRate.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  try {
    const exchangeRate = await fetchJpyToTwdRate();

    response.setHeader("Cache-Control", "no-store");

    return response.status(200).json({
      success: true,
      ...exchangeRate,
    });
  } catch (error) {
    console.error(
      "取得日圓匯率失敗：",
      error instanceof Error ? error.message : "Unknown error",
    );

    response.setHeader("Cache-Control", "no-store");

    return response.status(503).json({
      success: false,
      message: "目前無法取得日圓匯率，請稍後再試",
    });
  }
}