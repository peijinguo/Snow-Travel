import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { currency } from "../../utils/filter";
import { clearCart } from "../../slice/cartSlice";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function Checkout() {
  const carts = useSelector((state) => state.cart.carts);
  const { total } = useSelector((state) => state.cart);

  const dispatch = useDispatch();
  //1
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const taiwanDistricts = {
    台北市: [
      "中正區",
      "大同區",
      "中山區",
      "松山區",
      "大安區",
      "萬華區",
      "信義區",
      "士林區",
      "北投區",
      "內湖區",
      "南港區",
      "文山區",
    ],
    新北市: [
      "板橋區",
      "三重區",
      "中和區",
      "永和區",
      "新莊區",
      "新店區",
      "土城區",
      "蘆洲區",
      "樹林區",
      "汐止區",
      "鶯歌區",
      "三峽區",
      "淡水區",
      "瑞芳區",
      "五股區",
      "泰山區",
      "林口區",
      "深坑區",
      "石碇區",
      "坪林區",
      "三芝區",
      "石門區",
      "八里區",
      "平溪區",
      "雙溪區",
      "貢寮區",
      "金山區",
      "萬里區",
      "烏來區",
    ],
    桃園市: [
      "桃園區",
      "中壢區",
      "大溪區",
      "楊梅區",
      "蘆竹區",
      "大園區",
      "龜山區",
      "八德區",
      "龍潭區",
      "平鎮區",
      "新屋區",
      "觀音區",
      "復興區",
    ],
    台中市: [
      "中區",
      "東區",
      "南區",
      "西區",
      "北區",
      "北屯區",
      "西屯區",
      "南屯區",
      "太平區",
      "大里區",
      "霧峰區",
      "烏日區",
      "豐原區",
      "后里區",
      "石岡區",
      "東勢區",
      "和平區",
      "新社區",
      "潭子區",
      "大雅區",
      "神岡區",
      "大肚區",
      "沙鹿區",
      "龍井區",
      "梧棲區",
      "清水區",
      "大甲區",
      "外埔區",
      "大安區",
    ],
    台南市: [
      "中西區",
      "東區",
      "南區",
      "北區",
      "安平區",
      "安南區",
      "永康區",
      "歸仁區",
      "新化區",
      "左鎮區",
      "玉井區",
      "楠西區",
      "南化區",
      "仁德區",
      "關廟區",
      "龍崎區",
      "官田區",
      "麻豆區",
      "佳里區",
      "西港區",
      "七股區",
      "將軍區",
      "學甲區",
      "北門區",
      "新營區",
      "後壁區",
      "白河區",
      "東山區",
      "六甲區",
      "下營區",
      "柳營區",
      "鹽水區",
      "善化區",
      "大內區",
      "山上區",
      "新市區",
      "安定區",
    ],
    高雄市: [
      "新興區",
      "前金區",
      "苓雅區",
      "鹽埕區",
      "鼓山區",
      "旗津區",
      "前鎮區",
      "三民區",
      "楠梓區",
      "小港區",
      "左營區",
      "仁武區",
      "大社區",
      "岡山區",
      "路竹區",
      "阿蓮區",
      "田寮區",
      "燕巢區",
      "橋頭區",
      "梓官區",
      "彌陀區",
      "永安區",
      "湖內區",
      "鳳山區",
      "大寮區",
      "林園區",
      "鳥松區",
      "大樹區",
      "旗山區",
      "美濃區",
      "六龜區",
      "內門區",
      "杉林區",
      "甲仙區",
      "桃源區",
      "那瑪夏區",
      "茂林區",
      "茄萣區",
    ],
    基隆市: [
      "仁愛區",
      "信義區",
      "中正區",
      "中山區",
      "安樂區",
      "暖暖區",
      "七堵區",
    ],
    新竹市: ["東區", "北區", "香山區"],
    嘉義市: ["東區", "西區"],
    新竹縣: [
      "竹北市",
      "竹東鎮",
      "新埔鎮",
      "關西鎮",
      "湖口鄉",
      "新豐鄉",
      "峨眉鄉",
      "寶山鄉",
      "北埔鄉",
      "芎林鄉",
      "橫山鄉",
      "尖石鄉",
      "五峰鄉",
    ],
    苗栗縣: [
      "苗栗市",
      "頭份市",
      "竹南鎮",
      "後龍鎮",
      "通霄鎮",
      "苑裡鎮",
      "卓蘭鎮",
      "造橋鄉",
      "西湖鄉",
      "頭屋鄉",
      "公館鄉",
      "銅鑼鄉",
      "三義鄉",
      "大湖鄉",
      "獅潭鄉",
      "三灣鄉",
      "南庄鄉",
      "泰安鄉",
    ],
    彰化縣: [
      "彰化市",
      "員林市",
      "和美鎮",
      "鹿港鎮",
      "溪湖鎮",
      "二林鎮",
      "田中鎮",
      "北斗鎮",
      "花壇鄉",
      "芬園鄉",
      "大村鄉",
      "永靖鄉",
      "伸港鄉",
      "線西鄉",
      "福興鄉",
      "秀水鄉",
      "埔心鄉",
      "埔鹽鄉",
      "大城鄉",
      "芳苑鄉",
      "竹塘鄉",
      "溪州鄉",
      "埤頭鄉",
      "二水鄉",
      "社頭鄉",
      "田尾鄉",
    ],
    南投縣: [
      "南投市",
      "埔里鎮",
      "草屯鎮",
      "竹山鎮",
      "集集鎮",
      "名間鄉",
      "鹿谷鄉",
      "中寮鄉",
      "魚池鄉",
      "國姓鄉",
      "水里鄉",
      "信義鄉",
      "仁愛鄉",
    ],
    雲林縣: [
      "斗六市",
      "斗南鎮",
      "虎尾鎮",
      "西螺鎮",
      "土庫鎮",
      "北港鎮",
      "古坑鄉",
      "大埤鄉",
      "莿桐鄉",
      "林內鄉",
      "二崙鄉",
      "崙背鄉",
      "麥寮鄉",
      "東勢鄉",
      "褒忠鄉",
      "台西鄉",
      "元長鄉",
      "四湖鄉",
      "口湖鄉",
      "水林鄉",
    ],
    嘉義縣: [
      "太保市",
      "朴子市",
      "布袋鎮",
      "大林鎮",
      "民雄鄉",
      "溪口鄉",
      "新港鄉",
      "六腳鄉",
      "東石鄉",
      "義竹鄉",
      "鹿草鄉",
      "水上鄉",
      "中埔鄉",
      "竹崎鄉",
      "梅山鄉",
      "番路鄉",
      "大埔鄉",
      "阿里山鄉",
    ],
    屏東縣: [
      "屏東市",
      "潮州鎮",
      "東港鎮",
      "恆春鎮",
      "萬丹鄉",
      "長治鄉",
      "麟洛鄉",
      "九如鄉",
      "里港鄉",
      "高樹鄉",
      "鹽埔鄉",
      "內埔鄉",
      "竹田鄉",
      "萬巒鄉",
      "泰武鄉",
      "來義鄉",
      "春日鄉",
      "獅子鄉",
      "牡丹鄉",
      "三地門鄉",
      "霧台鄉",
      "瑪家鄉",
      "九如鄉",
      "里港鄉",
      "高樹鄉",
      "鹽埔鄉",
      "長治鄉",
      "麟洛鄉",
      "竹田鄉",
      "內埔鄉",
      "萬巒鄉",
      "崁頂鄉",
      "新埤鄉",
      "南州鄉",
      "林邊鄉",
      "琉球鄉",
      "佳冬鄉",
      "新園鄉",
      "枋寮鄉",
      "枋山鄉",
    ],
    宜蘭縣: [
      "宜蘭市",
      "羅東鎮",
      "蘇澳鎮",
      "頭城鎮",
      "礁溪鄉",
      "壯圍鄉",
      "員山鄉",
      "冬山鄉",
      "五結鄉",
      "三星鄉",
      "大同鄉",
      "南澳鄉",
    ],
    花蓮縣: [
      "花蓮市",
      "鳳林鎮",
      "玉里鎮",
      "新城鄉",
      "吉安鄉",
      "壽豐鄉",
      "光復鄉",
      "豐濱鄉",
      "瑞穗鄉",
      "富里鄉",
      "秀林鄉",
      "萬榮鄉",
      "卓溪鄉",
    ],
    台東縣: [
      "台東市",
      "成功鎮",
      "關山鎮",
      "卑南鄉",
      "鹿野鄉",
      "池上鄉",
      "東河鄉",
      "長濱鄉",
      "太麻里鄉",
      "大武鄉",
      "綠島鄉",
      "海端鄉",
      "延平鄉",
      "金峰鄉",
      "達仁鄉",
      "蘭嶼鄉",
    ],
    澎湖縣: ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
    金門縣: ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
    連江縣: ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"],
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    // 2
    defaultValues: {
      payment: "信用卡一次付清",
    },
  });

  const selectedCity = watch("city");
  const selectedPayment = watch("payment");

  //3 加入付款表單函式, 這會建立一個隱藏表單，把訂單 ID 送到 Vercel 後端
  const redirectToEcpay = (orderId) => {
    const paymentForm = document.createElement("form");
    paymentForm.method = "POST";
    paymentForm.action = "/api/ecpay/checkout";

    const orderInput = document.createElement("input");
    orderInput.type = "hidden";
    orderInput.name = "orderId";
    orderInput.value = orderId;

    paymentForm.appendChild(orderInput);
    document.body.appendChild(paymentForm);
    paymentForm.submit();
  };

  const onSubmit = async (formData) => {
    //4
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const data = {
        user: formData,
        message: formData.message,
      };
      const response = await axios.post(`${API_BASE}/api/${API_PATH}/order`, {
        data,
      });
      // if (response.data.success) {
      //   await dispatch(clearCart());
      if (!response.data.success) {
        throw new Error(response.data.message || "建立訂單失敗");
      }

      const { orderId } = response.data;
      dispatch(clearCart());
      redirectToEcpay(orderId);
    } catch (error) {
      console.error("訂單送出失敗：", error.response?.data || error.message);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "訂單送出失敗，請稍後再試",
      );

      setIsSubmitting(false);
    }
  };

  //新增匯率狀態
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState("");
  //加入取得匯率的程式
  useEffect(() => {
    let cancelled = false;

    const getExchangeRate = async () => {
      try {
        const response = await axios.get("/api/exchange-rate");

        if (
          !response.data.success ||
          !Number.isFinite(response.data.rate) ||
          response.data.rate <= 0
        ) {
          throw new Error("匯率資料格式錯誤");
        }

        if (!cancelled) {
          setExchangeRate(response.data);
          setRateError("");
        }
      } catch (error) {
        console.error(
          "取得日圓匯率失敗：",
          error.response?.data || error.message,
        );

        if (!cancelled) {
          setExchangeRate(null);
          setRateError(
            error.response?.data?.message ||
              "目前無法取得日圓匯率，請稍後重新整理",
          );
        }
      } finally {
        if (!cancelled) {
          setRateLoading(false);
        }
      }
    };

    getExchangeRate();

    return () => {
      cancelled = true;
    };
  }, []);

  // 顯示預估台幣金額
  const estimatedTwdAmount = exchangeRate
    ? Math.round(Number(total) * exchangeRate.rate)
    : null;

  const formattedTwdAmount =
    estimatedTwdAmount === null
      ? ""
      : estimatedTwdAmount.toLocaleString("zh-TW", {
          style: "currency",
          currency: "TWD",
          maximumFractionDigits: 0,
        });

  const formattedRateTime = exchangeRate?.fetchedAt
    ? new Date(exchangeRate.fetchedAt).toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
      })
    : "";

  return (
    <div className="bg-light pt-5 pb-7 text-start">
      <div className="container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row justify-content-center flex-md-row flex-column-reverse">
            <div className="col-md-6">
              <div className="bg-white p-4">
                <h4 className="fw-bold">1. 聯絡表單</h4>
                <p className="mt-4">聯絡資訊</p>
                <div className="mb-2">
                  <label
                    htmlFor="ContactMail"
                    className="text-muted mb-0 form-label"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control rounded-0"
                    id="ContactMail"
                    aria-describedby="emailHelp"
                    placeholder="example@gmail.com"
                    {...register("email", {
                      required: "必填",
                      pattern: {
                        value:
                          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "格式不正確",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-danger">{errors.email.message}</p>
                  )}
                </div>
                <div className="form-group form-check">
                  <input
                    type="checkbox"
                    className="form-check-input rounded-0"
                    id="ContactLorem"
                  />
                  <label className="form-check-label" htmlFor="ContactLorem">
                    我想收到最新優惠資訊與專屬折扣。
                  </label>
                </div>
                <div className="mb-2">
                  <label
                    htmlFor="ContactName"
                    className="text-muted mb-0 form-label"
                  >
                    姓名
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    id="ContactName"
                    placeholder="林小弘"
                    {...register("name", {
                      required: "請輸入姓名",
                      minLength: {
                        value: 2,
                        message: "姓名最少兩個字",
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="text-danger">{errors.name.message}</p>
                  )}
                </div>
                <div className="">
                  <label
                    htmlFor="ContactPhone"
                    className="text-muted mb-0 form-label"
                  >
                    電話
                  </label>
                  <input
                    type="tel"
                    className="form-control rounded-0"
                    id="ContactPhone"
                    placeholder="0933-123-123"
                    {...register("tel", {
                      required: "請輸入電話",
                      pattern: {
                        value: /^\d+$/,
                        message: "電話僅能輸入數字",
                      },
                      minLength: {
                        value: 8,
                        message: "電話最少 8 碼",
                      },
                    })}
                  />
                  {errors.tel && (
                    <p className="text-danger">{errors.tel.message}</p>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 mt-3">
                <h4 className="fw-bold">2. 寄送表單</h4>
                <p className="mt-4 mb-3">收件地址</p>
                <div className="form-row">
                  <div className="col mb-2">
                    <select
                      id="inputState"
                      className={`form-select rounded-0 ${errors.city ? "is-invalid" : ""}`}
                      {...register("city", { required: "--請選擇縣市--" })}
                    >
                      <option value="">--請選擇縣市--</option>
                      {Object.keys(taiwanDistricts).map((city) => {
                        return (
                          <option value={city} key={city}>
                            {city}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col mb-2">
                    <select
                      id="inputState"
                      className={`form-select rounded-0 ${errors.district ? "is-invalid" : ""}`}
                      {...register("district", { required: "--請選擇區域--" })}
                      disabled={!selectedCity} // 未選縣市前禁用
                    >
                      <option value="">--請選擇區域--</option>
                      {selectedCity &&
                        taiwanDistricts[selectedCity].map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  className={`form-control rounded-0 mt-1 ${errors.address ? "is-invalid" : ""}`}
                  id="inputCity"
                  placeholder="詳細地址"
                  {...register("address", { required: "地址必填" })}
                />
                <p className="mt-4 mb-2">付款方式</p>

                {/* 4 */}
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="Credit"
                    value="信用卡一次付清"
                    {...register("payment", {
                      required: "請選擇付款方式",
                    })}
                  />
                  <label
                    className="form-check-label text-muted"
                    htmlFor="Credit"
                  >
                    信用卡一次付清（綠界測試）
                  </label>
                  <div className="form-text">
                    此為測試環境，不會產生實際扣款。
                  </div>
                </div>
              </div>
              {/* 5 */}
              {submitError && (
                <div className="alert alert-danger mt-3" role="alert">
                  {submitError}
                </div>
              )}

              <div className="d-flex flex-column-reverse flex-md-row mt-4 justify-content-between align-items-md-center align-items-end w-100 checkout-action-row">
                <Link to="/cart" className="text-dark mt-md-0 mt-3">
                  <i className="fas fa-chevron-left me-2"></i> 返回購物車
                </Link>
                <button
                  type="submit"
                  className="btn btn-dark py-3 px-7 rounded-0"
                  // 6 匯率失敗時禁止付款
                  disabled={isSubmitting || rateLoading || Boolean(rateError)}
                >
                  {isSubmitting
                    ? "前往付款中..."
                    : rateLoading
                      ? "取得匯率中..."
                      : "前往綠界付款"}
                </button>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border p-4 mb-4">
                <h4 className="mb-4">訂單明細</h4>
                {carts.map((cartItem) => (
                  <div className="d-flex order-row-item" key={cartItem.id}>
                    <img
                      src={cartItem.product.imageUrl}
                      alt={cartItem.product.title}
                      className="me-2"
                      style={{
                        width: "48px",
                        height: "48px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="w-100">
                      <div className="d-flex justify-content-between fw-bold">
                        <p className="mb-0">{cartItem.product.title}</p>
                        <p className="mb-0">{cartItem.qty}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p className="text-muted mb-0">
                          <small>{currency(cartItem.product.price)}</small>
                        </p>
                        <p className="mb-0">{currency(cartItem.total)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <table className="table mt-4 border-top border-bottom text-muted">
                  <tbody>
                    <tr>
                      <th
                        scope="row"
                        className="border-0 px-0 pt-0 pb-4 font-weight-normal"
                      >
                        付款方式
                      </th>
                      <td className="text-end border-0 px-0 pt-0 pb-4">
                        {selectedPayment || "尚未選擇"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="d-flex justify-content-between mt-4">
                  <p className="mb-0 h4 fw-bold">總計</p>
                  <p className="mb-0 h4 fw-bold">{currency(total)}</p>
                </div>
                {rateLoading && (
                  <p className="text-muted mt-3 mb-0">正在取得臺銀匯率……</p>
                )}

                {rateError && (
                  <div className="alert alert-warning mt-3 mb-0" role="alert">
                    {rateError}
                  </div>
                )}

                {exchangeRate && estimatedTwdAmount !== null && (
                  <div className="border-top mt-3 pt-3">
                    <div className="d-flex justify-content-between">
                      <span>預估刷卡金額</span>
                      <strong>{formattedTwdAmount}</strong>
                    </div>

                    <p className="small text-muted mt-2 mb-0">
                      臺銀日圓即期賣出：¥1 = NT$
                      {exchangeRate.rate.toFixed(4)}
                    </p>

                    <p className="small text-muted mb-0">
                      匯率取得時間：{formattedRateTime}
                    </p>

                    <p className="small text-muted mb-0">
                      實際金額以進入綠界時的匯率為準
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
