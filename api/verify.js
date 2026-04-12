export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'ใช้ POST เท่านั้น' });
    }
    
    const { key, hwid } = req.body;
    
    if (!key || !hwid) {
        return sendLuaError(res, "ส่ง key และ hwid ด้วย");
    }
    
    const validKeys = process.env.SECRET_KEYS ? process.env.SECRET_KEYS.split(',') : [];
    
    if (!validKeys.includes(key)) {
        return sendLuaError(res, "คีย์ไม่ถูกต้อง");
    }
    
    if (!global.hwidStorage) global.hwidStorage = {};
    
    if (!global.hwidStorage[key]) {
        global.hwidStorage[key] = hwid;
        return sendLuaSuccess(res);
    }
    
    if (global.hwidStorage[key] !== hwid) {
        return sendLuaError(res, "คีย์นี้ใช้กับเครื่องอื่นอยู่");
    }
    
    return sendLuaSuccess(res);
}

// ถ้าผิด → ส่ง error
function sendLuaError(res, message) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`error("❌ ${message}")`);
}

// ถ้าถูก → โหลดสคริปต์เกม
function sendLuaSuccess(res) {
    const gameScriptUrl = process.env.GAME_SCRIPT_URL || "https://your-app.vercel.app/scripts/game.lua";
    
    const luaScript = `
        print("✅ คีย์ถูกต้อง กำลังโหลดเกม...")
        loadstring(game:HttpGet("${gameScriptUrl}"))()
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(luaScript);
        }
