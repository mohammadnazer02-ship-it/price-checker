const sheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRd___xPf5FPvrxX3iX_0m_LZa60GXmIJb9nYc7FR5-3mf9heUJBK4a2kROS3B5ptT7gXzUDbXGrDFH/pub?output=csv";

const result = document.getElementById("result");

const scanButton = document.getElementById("scanButton");

const reader = document.getElementById("reader");

let products = [];

let scanner = null;

// تنظيف النص
function cleanText(value) {
  return String(value).replace(/"/g, "").replace(/\s/g, "").trim();
}

// تحميل المنتجات
async function loadProducts() {
  try {
    const response = await fetch(sheetUrl);

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const csvText = await response.text();

    products = parseCSV(csvText);

    console.log("Products loaded:", products);

    if (products.length === 0) {
      result.innerHTML = `
                <div class="error">
                    ❌ ما قدرنا نقرأ المنتجات من قائمة الأسعار
                </div>
            `;

      return false;
    }

    return true;
  } catch (error) {
    console.error(error);

    result.innerHTML = `
            <div class="error">
                ❌ صار خطأ بتحميل قائمة الأسعار
            </div>
        `;

    return false;
  }
}

// قراءة CSV
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);

  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => cleanText(header));

  const barcodeIndex = headers.indexOf("Barcode");

  const productIndex = headers.indexOf("ProductName");

  const priceIndex = headers.indexOf("Price");

  if (barcodeIndex === -1 || productIndex === -1 || priceIndex === -1) {
    console.error("Headers:", headers);

    return [];
  }

  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i]
      .split(",")
      .map((value) => value.trim().replace(/"/g, ""));

    if (columns.length < 3) {
      continue;
    }

    const barcode = cleanText(columns[barcodeIndex]);

    const product = columns[productIndex].trim();

    const price = columns[priceIndex].trim();

    if (!barcode) {
      continue;
    }

    data.push({
      barcode: barcode,

      product: product,

      price: price,
    });
  }

  return data;
}

// البحث عن المنتج
function findProduct(barcode) {
  const cleanBarcode = cleanText(barcode);

  const product = products.find((item) => {
    return cleanText(item.barcode) === cleanBarcode;
  });

  if (!product) {
    result.innerHTML = `

            <div class="not-found">

                <h2>❌ الصنف غير موجود</h2>

                <p>
                    ما لقينا منتج بهذا الباركود
                </p>

                <p>
                    ${barcode}
                </p>

                <button
                    class="new-scan"
                    onclick="startScanner()">

                    📷 مسح منتج آخر

                </button>

            </div>

        `;

    return;
  }

  result.innerHTML = `

        <div class="product">

            <h2>
                ${product.product}
            </h2>

            <div class="price-label">
                السعر
            </div>

            <div class="price">
                ${product.price} JD
            </div>

            <button
                class="new-scan"
                onclick="startScanner()">

                📷 مسح منتج آخر

            </button>

        </div>

    `;
}

// تشغيل الكاميرا
async function startScanner() {
  result.innerHTML = "";

  reader.innerHTML = "";

  if (scanner) {
    try {
      await scanner.stop();
    } catch (error) {
      console.log(error);
    }

    scanner = null;
  }

  scanner = new Html5Qrcode("reader");

  try {
    await scanner.start(
      {
        facingMode: "environment",
      },

      {
        fps: 10,

        qrbox: {
          width: 280,
          height: 150,
        },
      },

      async (decodedText) => {
        console.log("Barcode:", decodedText);

        try {
          await scanner.stop();
        } catch (error) {
          console.log(error);
        }

        reader.innerHTML = "";

        findProduct(decodedText);
      },

      () => {
        // تجاهل أخطاء القراءة العادية
      },
    );
  } catch (error) {
    console.error(error);

    reader.innerHTML = "";

    result.innerHTML = `

            <div class="error">

                ❌ ما قدرنا نفتح الكاميرا

                <br><br>

                تأكد أنك سمحت للموقع باستخدام الكاميرا.

            </div>

        `;
  }
}

// زر مسح الباركود
scanButton.addEventListener("click", startScanner);

// تحميل الأسعار عند فتح الصفحة
async function initialize() {
  result.innerHTML = `

        <div class="loading">

            ⏳ جاري تحميل الأسعار...

        </div>

    `;

  const success = await loadProducts();

  if (success) {
    result.innerHTML = `

            <p>
                ✅ جاهز لمسح الباركود
            </p>

        `;
  }
}

initialize();
