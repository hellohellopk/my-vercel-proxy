// 這是一個 Vercel Serverless Function
// 檔案路徑： /api/proxy.js
// 它會變成一個 API 端點： https://<你的網址>/api/proxy

export default async function handler(request, response) {
  // 1. 從查詢參數中獲取目標 URL
  // 使用 request.query 來取得 URL 參數
  const url = request.query.url;

  if (!url) {
    response.status(400).send('錯誤：請提供 ?url= 參數');
    return;
  }

  try {
    // 2. 處理 CORS 預檢請求 (Preflight OPTIONS request)
    // 這是讓瀏覽器「跨域」的關鍵
    if (request.method === 'OPTIONS') {
      setCorsHeaders(response);
      response.status(200).end();
      return;
    }

    // 3. 偽裝成瀏覽器，向目標 URL 發送請求
    // 我們使用 Vercel 環境中內建的 fetch
    const targetResponse = await fetch(url, {
      headers: {
        // ** 關鍵：偽裝 User-Agent **
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // ** 關鍵：偽裝 Referer **
        'Referer': 'https://www.google.com/',
      },
    });

    // 4. 加上 CORS 標頭，準備回傳給「你的」前端
    setCorsHeaders(response);

    // 5. 將 Apple 回傳的「狀態碼」(例如 200, 404) 原封不動地回傳
    response.status(targetResponse.status);

    // 6. 將 Apple 回傳的「內容」(HTML) 直接回傳
    const content = await targetResponse.text();
    response.send(content);

  } catch (error) {
    console.error('代理請求失敗:', error);
    setCorsHeaders(response);
    response.status(500).send(`代理伺服器內部錯誤: ${error.message}`);
  }
}

// 輔助函式：設定標準的 CORS 回應標頭
function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*'); // 允許任何網域
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
