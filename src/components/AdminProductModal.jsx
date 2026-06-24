import { forwardRef, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const AdminProductModal = forwardRef(({
  modalType,
  templateProduct,
  getProducts,
  closeModal,
}, ref) => {
  //把值傳進來, 不去改變父元件的資料
  //建一個新的tempData來接templateProduct,把所有資料用tempData做渲染
  const [tempData, setTempData] = useState(templateProduct)

  useEffect(() => {
    setTempData(templateProduct);
  }, [templateProduct]);

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempData((preData) => ({
      ...preData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  };

  const handleModalImageChange = (index, value) => {
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage[index] = value
      // 優化新增:value不等於空時, 輸入的最後一筆, 限制最多新增5筆, 滿足條件就push空的輸入框
      if (value !== "" && index === newImage.length - 1 && newImage.length < 5) {
        newImage.push('');
      }
      // 優化移除:value等於空時, 不能全部刪光, 至少留一個, 正在修改的值是最後一個input是空值時就把他清掉
      if (value === "" && newImage.length > 1 && newImage[newImage.length - 1] === "") {
        newImage.pop();
      }
      return {
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  const handleAddImage = () => {
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  }

  const handleRemoveImage = () => {
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  }

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`
    let method = 'post'

    if (modalType === 'edit') {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      method = 'put'
    }

    //一開始INITIAL_TEMPLATE_DATA 數字是用string, enable為了渲染方便是用true/false, 因文件上數字是數字型態, 送出前要型態轉換
    const productData = {
      data: {
        ...tempData,
        origin_price: Number(tempData.origin_price),
        price: Number(tempData.price),
        is_enabled: tempData.is_enabled ? 1 : 0,
        // 必免中間的圖刪除後出現空的input框在中間
        imagesUrl: [...tempData.imagesUrl.filter((url) => url !== "")],
      }
    }

    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      //修改後重新取得API, 關掉modal
      getProducts();
      closeModal();
    } catch (error) {
      console.dir(error.response.data.message);
    }
  }

  const delProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`)
      console.log(response.data);
      //刪除後要更新產品資訊
      getProducts();
      closeModal();
    } catch (error) {
      console.dir(error.response.data.message);
    }
  }

  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      return;
    }
    try {
      const formData = new FormData()
      formData.append('file-to-upload', file)

      const response = await axios.post(`${API_BASE}/api/${API_PATH}/admin/upload`, formData);

      setTempData((pre) => ({
        ...pre,
        imageUrl: response.data.imageUrl,
      }));
    } catch (error) {
      console.error("Upload error:", error);
    }
  }

  return (
    <div
      className="modal fade"
      id="AdminProductModal"
      tabIndex="-1"
      ref={ref}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
            <h5 id="AdminProductModalLabel" className="modal-title">
              <span>
                {modalType === 'delete'
                  ? '刪除'
                  : modalType === 'edit'
                    ? '編輯'
                    : '新增'}
                產品
              </span>
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {modalType === 'delete' ? (
              <p className="fs-4">
                確定要刪除
                <span className="text-danger">{tempData.title}</span>嗎？
              </p>
            ) : (
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="fileUpload" className="form-label">
                        上傳圖片
                      </label>
                      <input
                        className="form-control"
                        type="file"
                        name="fileUpload"
                        id="fileUpload"
                        accept=".jpg, .png, .jpeg"
                        onChange={uploadImage}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                        value={tempData.imageUrl}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                    {tempData.imageUrl && (
                      <img className="img-fluid" src={tempData.imageUrl} alt="主圖" />
                    )
                    }
                  </div>
                  <div>
                    {/*多筆資料渲染在畫面上, 用map*/}
                    {tempData.imagesUrl.map((url, index) => (
                      <div key={index}>
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`圖片網址${index + 1}`}
                          value={url}
                          onChange={(e) => handleModalImageChange(index, e.target.value)}
                        />
                        {url &&
                          <img
                            className="img-fluid"
                            src={url}
                            alt={`副圖${index + 1}`}
                          />
                        }
                      </div>
                    ))}
                    {/*優化:增加5筆後,新增按鈕會隱藏 && 最後一筆不等於空才可以增加*/}
                    {
                      tempData.imagesUrl.length < 5 &&
                      tempData.imagesUrl[tempData.imagesUrl.length - 1] !== "" &&
                      (
                        <button className="btn btn-outline-dark btn-sm d-block w-100"
                          onClick={() => handleAddImage()}>
                          新增圖片
                        </button>
                      )
                    }
                  </div>
                  <div>
                    {/*優化:移除按鈕, 有值的話按鈕才會出現*/}
                    {
                      tempData.imagesUrl.length >= 1 &&
                      (<button className="btn btn-outline-danger btn-sm d-block w-100"
                        onClick={() => handleRemoveImage()}>
                        刪除圖片
                      </button>
                      )
                    }
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題</label>
                    <input
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      value={tempData.title}
                      onChange={(e) => handleModalInputChange(e)}
                    />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">分類</label>
                      <input
                        name="category"
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                        value={tempData.category}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">類別</label>
                      <input
                        name="unit"
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入類別"
                        value={tempData.unit}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <input
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入原價"
                        value={tempData.origin_price}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">售價</label>
                      <input
                        name="price"
                        id="price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入售價"
                        value={tempData.price}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea
                      name="description"
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={tempData.description}
                      onChange={(e) => handleModalInputChange(e)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea
                      name="content"
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={tempData.content}
                      onChange={(e) => handleModalInputChange(e)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        name="is_enabled"
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={tempData.is_enabled}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-check-label" htmlFor="equipment">
                      雪具
                    </label>
                    <select
                      id="equipment"
                      name="equipment"
                      className="form-select"
                      aria-label="Default select example"
                      value={tempData.equipment}
                      onChange={(e) => handleModalInputChange(e)}
                    >
                      <option value="">請選擇</option>
                      <option value="lg">單板</option>
                      <option value="md">雙板</option>
                      <option value="sm">雪橇</option>
                    </select>
                  </div>
                </div>
              </div>


            )}

          </div>
          <div className="modal-footer">
            {
              modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(tempData.id)}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => updateProduct(tempData.id)}
                  >確認
                  </button>
                </>

              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
)
export default AdminProductModal;