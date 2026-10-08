/**
 * ============================================================
 *  🚀 Free Fire Top-Up API — Pure Node.js (Playwright)
 *  Author: Auto-generated
 *  Usage : npm start → http://localhost:3000
 * ============================================================
 */

const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ============================================================
 *  🧠 Helper — clean string (only alphanumeric, uppercase)
 * ============================================================ */
function cleanSerial(str) {
    return String(str || "").replace(/[^A-Za-z0-9]/g, "").trim().toUpperCase();
}
function cleanPin(str) {
    return String(str || "").replace(/[^A-Za-z0-9]/g, "").trim();
}

/* ============================================================
 *  🎯 MAIN TOPUP FUNCTION
 * ============================================================ */
async function processFreeFireTopup(playerUid, diamondAmount, voucherCode, pinCode = "") {
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-size=1280,800",
            ],
        });

        const context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport: { width: 1280, height: 800 },
            locale: "en-US",
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", {
                get: () => undefined,
            });
        });

        /* ---------- 1. Open shop ---------- */
        await page.goto(
            "https://shop.garena.my/?app=100067&channel=202953",
            { waitUntil: "domcontentloaded", timeout: 60000 }
        );
        await page.waitForTimeout(2000);

        /* ---------- 2. Enter UID ---------- */
        const uidInput = page
            .locator(
                "input[placeholder*='player ID'], input[placeholder*='Player ID'], input[type='text']"
            )
            .first();
        await uidInput.waitFor({ timeout: 15000 });
        await uidInput.click();
        await uidInput.type(String(playerUid), { delay: 100 });
        await page.waitForTimeout(1000);

        /* ---------- 3. Click Login ---------- */
        const loginBtn = page
            .locator(
                "button:has-text('Login'), div[role='button']:has-text('Login'), .login-btn"
            )
            .first();
        if (await loginBtn.isVisible().catch(() => false)) {
            await loginBtn.click();
        } else {
            await page.keyboard.press("Enter");
        }
        await page.waitForTimeout(3000);

        /* ---------- 4. Proceed to Payment ---------- */
        const proceedBtn = page
            .locator(
                "button:has-text('Proceed to Payment'), div[role='button']:has-text('Proceed to Payment'), button:has-text('Login')"
            )
            .first();
        await proceedBtn.waitFor({ timeout: 10000 });
        await proceedBtn.click();
        await page.waitForTimeout(2000);

        /* ---------- 5. Select Diamond ---------- */
        const numOnly = String(diamondAmount).replace(/\D/g, "");
        const diamondOption = page
            .locator(`text=/${numOnly}\\s*Diamond/i`)
            .first();

        if (await diamondOption.isVisible().catch(() => false)) {
            await diamondOption.click();
        } else {
            await page.locator(`text=${numOnly}`).first().click();
        }
        await page.waitForTimeout(1500);

        /* ---------- 6. Physical Vouchers tab ---------- */
        const physicalVoucherTab = page.locator("text=Physical Vouchers").first();
        await physicalVoucherTab.waitFor({ timeout: 10000 });
        await physicalVoucherTab.click();
        await page.waitForTimeout(1500);

        /* ---------- 7. Parse voucher code ---------- */
        let rawSerial = voucherCode;
        let rawPin = pinCode;

        if (/\s|,/.test(voucherCode)) {
            const parts = voucherCode.trim().split(/[\s,]+/);
            rawSerial = parts[0];
            rawPin = parts[1] || pinCode;
        }

        const serialClean = cleanSerial(rawSerial);
        const pinClean = cleanPin(rawPin);

        /* ---------- 8. Choose provider by prefix ---------- */
        if (serialClean.startsWith("BDMB")) {
            const uniPin = page.locator("text=/UniPin/i").first();
            await uniPin.click();
        } else if (serialClean.startsWith("UPBD")) {
            const upGift = page.locator("text=/UP Gift/i").first();
            await upGift.click();
        } else {
            await browser.close();
            return {
                success: false,
                reason: "INVALID_PREFIX",
                message: "Invalid Voucher Prefix",
            };
        }

        await page.waitForTimeout(2000);

        /* ---------- 9. Find target frame ---------- */
        let targetScope = page;
        for (const frame of page.frames()) {
            const url = frame.url();
            if (url.includes("unipin") || url.includes("unibox")) {
                targetScope = frame;
                break;
            }
        }

        /* ---------- 10. Fill Serial ---------- */
        const serialInput = targetScope
            .locator(
                "input[placeholder*='UPBD'], input[placeholder*='Serial'], input[type='text']"
            )
            .first();
        await serialInput.waitFor({ timeout: 10000 });
        await serialInput.click();
        await serialInput.fill(serialClean);
        await page.waitForTimeout(500);

        /* ---------- 11. Fill PIN ---------- */
        const pinInputs = targetScope.locator(
            "input[type='password'], input[name*='pin'], input[id*='pin']"
        );
        const pinCount = await pinInputs.count();

        if (pinCount >= 4 && pinClean.length >= 12) {
            // Split into 4-char chunks
            const chunks = pinClean.match(/.{1,4}/g) || [];
            for (let i = 0; i < Math.min(chunks.length, 4); i++) {
                const inp = pinInputs.nth(i);
                await inp.click();
                await inp.fill(chunks[i]);
                await page.waitForTimeout(100);
            }
        } else if (pinCount > 0) {
            const firstPin = pinInputs.first();
            await firstPin.click();
            if (pinClean.length === 16) {
                const formatted = pinClean.match(/.{1,4}/g).join("-");
                await firstPin.fill(formatted);
            } else {
                await firstPin.fill(pinClean);
            }
        }

        await page.waitForTimeout(1500);

        /* ---------- 12. Click Confirm ---------- */
        const confirmBtn = targetScope
            .locator(
                "input[type='submit'][value='Confirm'], input[value='Confirm']"
            )
            .first();

        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.scrollIntoViewIfNeeded();
            await confirmBtn.click({ force: true });
        } else {
            await targetScope.evaluate(() => {
                const btn =
                    document.querySelector("input[type='submit'][value='Confirm']") ||
                    document.querySelector("input[value='Confirm']");
                if (btn) btn.click();
            });
        }

        await page.waitForTimeout(7000);

        /* ---------- 13. Check result ---------- */
        let content = "";
        try {
            content = await targetScope.content();
        } catch {}
        let mainContent = "";
        try {
            mainContent = await page.content();
        } catch {}

        const fullText = (content + mainContent).toLowerCase();
        const currentUrl = page.url().toLowerCase();

        if (
            fullText.includes("consumed voucher") ||
            currentUrl.includes("consumed%20voucher") ||
            currentUrl.includes("consumed voucher")
        ) {
            await browser.close();
            return {
                success: false,
                reason: "CONSUMED_VOUCHER",
                message: "Voucher is already consumed/used.",
            };
        }

        const successKeywords = [
            "transaction successful",
            "transactions successful",
            "successful",
            "transaction success",
            "transactions success",
            "success",
            "completed",
        ];

        if (successKeywords.some((w) => fullText.includes(w))) {
            await browser.close();
            return {
                success: true,
                message: "Topup Completed Successfully!",
            };
        }

        await browser.close();
        return {
            success: false,
            reason: "FAILED",
            message: "Transaction Failed or Invalid Voucher Error.",
        };
    } catch (err) {
        if (browser) {
            try {
                await browser.close();
            } catch {}
        }
        return {
            success: false,
            reason: "ERROR",
            message: err.message,
        };
    }
}

/* ============================================================
 *  🔒 Simple Queue — একসাথে একটা request process
 * ============================================================ */
let isProcessing = false;
const queue = [];

function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    const job = queue.shift();

    processFreeFireTopup(
        job.playerUid,
        job.diamondAmount,
        job.voucherCode,
        job.pinCode
    )
        .then((result) => job.resolve(result))
        .catch((err) =>
            job.resolve({
                success: false,
                reason: "INTERNAL_ERROR",
                message: err.message,
            })
        )
        .finally(() => {
            isProcessing = false;
            setImmediate(processQueue);
        });
}

/* ============================================================
 *  🌐 GET /topup
 *  Query: uid, diamond, voucher, pin (optional)
 * ============================================================ */
app.get("/topup", async (req, res) => {
    const { uid, diamond, voucher, pin } = req.query;

    // Validation
    if (!uid || !diamond || !voucher) {
        return res.status(400).json({
            success: false,
            reason: "INVALID_PARAMS",
            message: "Required query params: uid, diamond, voucher",
        });
    }

    if (!/^\d+$/.test(uid)) {
        return res.status(400).json({
            success: false,
            reason: "INVALID_UID",
            message: "Player UID must be numeric",
        });
    }

    const result = await new Promise((resolve) => {
        queue.push({
            playerUid: uid,
            diamondAmount: diamond,
            voucherCode: voucher,
            pinCode: pin || "",
            resolve,
        });
        processQueue();
    });

    return res.status(result.success ? 200 : 422).json({
        ...result,
        timestamp: new Date().toISOString(),
    });
});

/* ============================================================
 *  ❤️  Health & Status
 * ============================================================ */
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "Free Fire Top-Up API (Node.js)",
        processing: isProcessing,
        queueLength: queue.length,
        uptime: process.uptime(),
    });
});

app.get("/status", (req, res) => {
    res.json({
        processing: isProcessing,
        queueLength: queue.length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

/* ============================================================
 *  🚀 Start Server
 * ============================================================ */
app.listen(PORT, () => {
    console.log("============================================================");
    console.log(`🚀 Free Fire Top-Up API running → http://localhost:${PORT}`);
    console.log(
        `📌 Example : http://localhost:${PORT}/topup?uid=123456789&diamond=100&voucher=BDMB1234ABCD5678`
    );
    console.log("============================================================");
});