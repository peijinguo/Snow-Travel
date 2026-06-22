const BOT_EXCHANGE_RATE_URL =
  "https://rate.bot.com.tw/xrt/flcsv/0/day";

const JPY_SPOT_SELLING_INDEX = 13;

export const parseJpyRate = (csvText) => {
  const normalizedText = csvText.replace(/^\uFEFF/, "");

  const jpyRow = normalizedText
    .split(/\r?\n/)
    .find((row) => row.startsWith("JPY,"));

  if (!jpyRow) {
    throw new Error("找不到臺灣銀行日圓匯率");
  }

  const columns = jpyRow.split(",");
  const rate = Number(columns[JPY_SPOT_SELLING_INDEX]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("臺灣銀行日圓匯率格式錯誤");
  }

  return rate;
};

export const convertJpyToTwd = (jpyAmount, rate) => {
  const amount = Number(jpyAmount);
  const exchangeRate = Number(rate);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("日幣金額必須是正整數");
  }

  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error("匯率必須大於零");
  }

  const twdAmount = Math.round(amount * exchangeRate);

  if (twdAmount <= 0) {
    throw new Error("換算後的台幣金額錯誤");
  }

  return twdAmount;
};

export const fetchJpyToTwdRate = async () => {
  const response = await fetch(BOT_EXCHANGE_RATE_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`無法取得臺灣銀行匯率：${response.status}`);
  }

  const csvText = await response.text();
  const rate = parseJpyRate(csvText);

  return {
    baseCurrency: "JPY",
    quoteCurrency: "TWD",
    rate,
    source: "Bank of Taiwan JPY spot selling",
    fetchedAt: new Date().toISOString(),
  };
};