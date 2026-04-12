export default async function handler(req, res) {
    // ตรวจสอบว่าเป็นวิธี POST หรือไม่
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'ต้องใช้ POST เท่านั้น' });
    }

    // รับค่าคีย์และ hwid จากผู้ใช้
    const { key, hwid } = req.body;

    // ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (!key || !hwid) {
        return sendLuaError(res, "กรุณาส่ง key และ hwid");
    }

    // ดึงคีย์ที่ใช้ได้จาก Environment Variables (แปลงข้อความให้เป็น array)
    const validKeys = process.env.SECRET_KEYS ? process.env.SECRET_KEYS.split(',') : [];

    // ตรวจสอบว่าคีย์ถูกต้องหรือไม่
    if (!validKeys.includes(key)) {
        return sendLuaError(res, "คีย์ไม่ถูกต้อง");
    }

    // สร้างที่เก็บ HWID (ถ้ายังไม่มี)
    if (!global.hwidStorage) global.hwidStorage = {};

    // กรณีที่ 1: ยังไม่เคยล็อค HWID มาก่อน → ล็อคเลย
    if (!global.hwidStorage[key]) {
        global.hwidStorage[key] = hwid;
        return sendLuaSuccess(res);
    }

    // กรณีที่ 2: HWID ไม่ตรงกับที่ล็อคไว้ → ใช้งานไม่ได้
    if (global.hwidStorage[key] !== hwid) {
        return sendLuaError(res, "คีย์นี้ถูกใช้กับเครื่องอื่นแล้ว");
    }

    // กรณีที่ 3: ผ่านทุกเงื่อนไข → ใช้งานได้
    return sendLuaSuccess(res);
}

// ฟังก์ชันส่งกลับเมื่อเกิดข้อผิดพลาด (เตะผู้เล่น)
function sendLuaError(res, message) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`error("❌ ${message}")`);
}

// ฟังก์ชันส่งกลับเมื่อสำเร็จ (โหลดเกมต่อ)
function sendLuaSuccess(res) {
    const gameScriptUrl = process.env.GAME_SCRIPT_URL || "https://your-app.vercel.app/scripts/game.lua";
    
    const luaScript = `
        print("✅ คีย์ถูกต้อง กำลังโหลดเกม...")
        loadstring(game:HttpGet("${gameScriptUrl}"))()
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(luaScript);
}
