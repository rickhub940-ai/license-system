export default async function handler(req, res) {
    // รองรับทั้ง GET และ POST
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'ต้องใช้ POST หรือ GET เท่านั้น' });
    }

    // รับค่าจากทั้ง body (POST) และ query (GET)
    const key = req.body?.key || req.query?.key;
    const hwid = req.body?.hwid || req.query?.hwid;

    if (!key || !hwid) {
        return sendLuaError(res, "กรุณาส่ง key และ hwid");
    }

    // โหลดคีย์จาก GitHub
    let validKeys = [];
    try {
        const keysUrl = process.env.KEYS_URL;
        if (keysUrl) {
            const response = await fetch(keysUrl);
            const data = await response.json();
            validKeys = data.keys || [];
        }
    } catch (error) {
        console.error("โหลดคีย์ไม่ได้:", error);
    }

    if (!validKeys.includes(key)) {
        return sendLuaError(res, "คีย์ไม่ถูกต้อง");
    }

    if (!global.hwidStorage) global.hwidStorage = {};

    if (!global.hwidStorage[key]) {
        global.hwidStorage[key] = hwid;
        return sendLuaSuccess(res);
    }

    if (global.hwidStorage[key] !== hwid) {
        return sendLuaError(res, "คีย์นี้ถูกใช้กับเครื่องอื่นแล้ว");
    }

    return sendLuaSuccess(res);
}

function sendLuaError(res, message) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`error("❌ ${message}")`);
}

function sendLuaSuccess(res) {
    const gameScriptUrl = process.env.GAME_SCRIPT_URL || "https://license-system-crkd.vercel.app/scripts/game.lua";
    
    const luaScript = `
        print("✅ คีย์ถูกต้อง กำลังโหลดเกม...")
        loadstring(game:HttpGet("${gameScriptUrl}"))()
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(luaScript);
}
