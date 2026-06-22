import { Link, useParams, useSearchParams } from "react-router-dom";
import { currency } from "../../utils/filter";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 1
const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 7;

function CheckoutSuccess() {
  const { orderId } = useParams();
  // 2
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment");
  const hasOrderId = Boolean(orderId);

  const [order, setOrder] = useState(null); // 存儲訂單資料
  const [loading, setLoading] = useState(hasOrderId);

  // 3
  const [checkingPayment, setCheckingPayment] = useState(hasOrderId);
  const [error, setError] = useState(hasOrderId ? "" : "缺少訂單編號");

  useEffect(() => {
    if (!orderId) {
      return;
    }
    let cancelled = false;
    let timeoutId;
    let attempts = 0;

    const checkOrder = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/${API_PATH}/order/${orderId}`,
        );

        if (!response.data.success || !response.data.order) {
          throw new Error("找不到訂單資訊");
        }

        if (cancelled) {
          return;
        }

        const nextOrder = response.data.order;

        setOrder(nextOrder);
        setLoading(false);
        setError("");

        if (nextOrder.is_paid) {
          setCheckingPayment(false);
          return;
        }

        attempts += 1;

        if (attempts >= MAX_POLL_ATTEMPTS) {
          setCheckingPayment(false);
          return;
        }

        timeoutId = window.setTimeout(checkOrder, POLL_INTERVAL);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "取得訂單失敗：",
          requestError.response?.data || requestError.message,
        );

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "取得訂單失敗",
        );

        setLoading(false);
        setCheckingPayment(false);
      }
    };

    checkOrder();

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [orderId]);

  if (loading && !order) {
    return <div className="container py-5">正在取得訂單資訊...</div>;
  }
  if (error && !order) {
    return (
      <div className="container py-5 text-center">
        <h2>無法取得訂單</h2>
        <p className="text-muted">{error}</p>
        <Link to="/" className="btn btn-outline-dark">
          返回首頁
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container py-5">找不到訂單資訊</div>;
  }

  const isPaid = Boolean(order.is_paid);
  const paymentFailed = paymentResult === "failed" && !isPaid;

  let statusTitle = "尚未確認付款";
  let statusMessage = "目前尚未收到付款成功通知，你可以稍後重新整理確認。";

  if (isPaid) {
    statusTitle = "付款成功！";
    statusMessage = "我們已收到你的付款，訂單已完成付款確認。";
  } else if (checkingPayment) {
    statusTitle = "正在確認付款";
    statusMessage = "綠界正在通知網站付款結果，請稍候，不要關閉此頁面。";
  } else if (paymentFailed) {
    statusTitle = "付款未完成";
    statusMessage = "這次付款沒有成功，訂單目前仍是未付款狀態。";
  }

  const paymentStatus = isPaid
    ? "已付款"
    : checkingPayment
      ? "確認中"
      : "未付款";

  const total = Number(order.total) || 0;
  const products = Object.values(order.products || {});

  // const dispatch = useDispatch();

  // const getOrder = async (id) => {
  //   try {
  //     setLoading(true);
  //     const res = await axios.get(
  //       `${API_BASE}/api/${API_PATH}/order/${id}`,
  //     );
  //     if (res.data.success) {
  //       // 前台單一訂單 API 回傳的是單一物件 { order: { ... } }
  //       setOrder(res.data.order);
  //     } else {
  //       console.error("找不到該訂單");
  //     }
  //   } catch (error) {
  //     console.error("取得訂單失敗", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (orderId) {
  //     getOrder(orderId);
  //   }
  // }, [orderId, dispatch]);

  // if (loading) return <div className="container mt-5">載入中...</div>;
  // if (!order) return <div className="container mt-5">找不到訂單資訊</div>;

  // const total = order.total || 0;

  return (
    <div className="container">
      <div
        style={{
          minHeight: "400px",
          backgroundSize: "cover",
          backgroundImage: "url(https://ppt.cc/fnPRwx@.jpg)",
          backgroundPosition: "center center",
        }}
      ></div>
      <div className="mt-5 mb-7 text-start">
        <div className="row">
          <div className="col-md-6">
            <h2>{statusTitle}</h2>
            <p aria-live="polite">{statusMessage}</p>
            {checkingPayment && (
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-label="正在確認付款"
              />
            )}

            {error && (
              <div className="alert alert-warning mt-3" role="alert">
                {error}
              </div>
            )}

            {!isPaid && !checkingPayment && (
              <button
                type="button"
                className="btn btn-dark me-2 rounded-0 mb-4"
                onClick={() => window.location.reload()}
              >
                重新確認付款
              </button>
            )}

            <Link to="/" className="btn btn-outline-dark me-2 rounded-0 mb-4">
              返回首頁
            </Link>
          </div>

          <div className="col-md-6">
            <div className="card rounded-0 py-4">
              <div className="card-header border-bottom-0 bg-white px-4 py-0">
                <h2>訂單明細</h2>
              </div>

              <div className="card-body px-4 py-0">
                <ul className="list-group list-group-flush">
                  {products.map((productItem) => (
                    <li className="list-group-item px-0" key={productItem.id}>
                      <div className="d-flex mt-2 order-row-item">
                        <img
                          src={productItem.product.imageUrl}
                          alt={productItem.product.title}
                          className="me-2"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                          }}
                        />

                        <div className="w-100 d-flex flex-column">
                          <div className="d-flex justify-content-between fw-bold">
                            <h5>{productItem.product.title}</h5>
                            <p className="mb-0">{productItem.qty}</p>
                          </div>

                          <div className="d-flex justify-content-between mt-auto">
                            <p className="text-muted mb-0">
                              <small>
                                {currency(productItem.product.price)}
                              </small>
                            </p>
                            <p className="mb-0">
                              {currency(productItem.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}

                  <li className="list-group-item px-0 pb-0">
                    <table className="table text-muted">
                      <tbody>
                        <tr>
                          <th
                            scope="row"
                            className="border-0 px-0 pt-0 font-weight-normal"
                          >
                            付款狀態
                          </th>
                          <td className="text-end border-0 px-0 pt-0">
                            {paymentStatus}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-between mt-2">
                      <p className="mb-0 h4 fw-bold">總計</p>
                      <p className="mb-0 h4 fw-bold">{currency(total)}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccess;
