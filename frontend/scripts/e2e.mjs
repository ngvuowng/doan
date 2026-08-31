/**
 * Kiểm thử đầu-cuối bằng Chrome thật qua DevTools Protocol.
 *
 * Không dùng Playwright/Puppeteer để tránh thêm phụ thuộc nặng chỉ cho việc kiểm thử;
 * Node 24 đã có sẵn WebSocket nên nói chuyện trực tiếp với CDP là đủ.
 *
 * Chạy:  node scripts/e2e.mjs            (mặc định http://localhost:3000)
 *        BASE_URL=... node scripts/e2e.mjs
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9222

let passed = 0
let failed = 0
const failures = []

function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Kết nối CDP tới tab đang mở. */
async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const tabs = await res.json()
      const page = tabs.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // Chrome chưa sẵn sàng.
    }
    await sleep(250)
  }
  throw new Error('Không kết nối được tới Chrome qua CDP')
}

function createSession(ws) {
  let nextId = 1
  const pending = new Map()

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    }
  })

  return function send(method, params = {}) {
    const id = nextId++
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          reject(new Error(`CDP timeout: ${method}`))
        }
      }, 30000)
    })
  }
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--user-data-dir=/tmp/halona-e2e-profile',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const wsUrl = await connect()
  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  const send = createSession(ws)
  await send('Page.enable')
  await send('Runtime.enable')

  /** Điều hướng và chờ trang ổn định. */
  async function goto(path) {
    await send('Page.navigate', { url: `${BASE}${path}` })
    // Chờ document sẵn sàng rồi cho React hydrate.
    for (let i = 0; i < 60; i++) {
      await sleep(200)
      const { result } = await send('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
      })
      if (result.value === 'complete') break
    }
    await sleep(700)
  }

  async function evaluate(expression) {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    })
    if (exceptionDetails) throw new Error(exceptionDetails.text ?? 'lỗi khi evaluate')
    return result.value
  }

  const url = () => evaluate('return location.pathname + location.search')
  const text = () => evaluate('return document.body.innerText')

  try {
    console.log(`\nKiểm thử ${BASE}\n`)

    // ---- 1. Trang chủ ----
    console.log('1. Trang chủ')
    await goto('/')
    const home = await text()
    check('hiện đủ 3 khối sản phẩm', ['TRÁI CÂY NHẬP KHẨU', 'TRÁI CÂY NỘI ĐỊA', 'NƯỚC ÉP'].every((t) => home.includes(t)))
    check('hiện đủ 4 sản phẩm', ['Bom mỹ', 'Vải nhập khẩu', 'Táo nhập khẩu', 'Cà chua Đà Lạt'].every((t) => home.includes(t)))
    check('hiện giá khuyến mãi', home.includes('180.000₫') && home.includes('30.000₫'))
    check('hiện khối bài viết', home.includes('CÓ THỂ BẠN CẦN'))
    const broken = await evaluate(
      'return [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src)',
    )
    check('không có ảnh vỡ', broken.length === 0, broken.join(', '))

    // ---- 2. Điều hướng tới chi tiết sản phẩm ----
    console.log('\n2. Điều hướng catalog')
    await goto('/danh-muc-san-pham/trai-cay-nhap-khau')
    check('trang danh mục mở được', (await text()).includes('Trái cây nhập khẩu'))
    await goto('/san-pham/bom-my')
    const detail = await text()
    check('chi tiết SP hiện tên + giá', detail.includes('Bom mỹ') && detail.includes('180.000₫'))
    check('chi tiết SP có mô tả', detail.includes('MÔ TẢ SẢN PHẨM'))
    check('chi tiết SP có SP liên quan', detail.includes('SẢN PHẨM LIÊN QUAN'))

    // ---- 3. Thêm vào giỏ hàng ----
    console.log('\n3. Giỏ hàng')
    await evaluate(`
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Thêm vào giỏ hàng'));
      btn.click();
      return true;
    `)
    await sleep(900)
    check('drawer giỏ hàng mở sau khi thêm', (await text()).includes('GIỎ HÀNG'))
    const badge = await evaluate(`
      const el = document.querySelector('[aria-label^="Giỏ hàng,"]');
      return el ? el.getAttribute('aria-label') : null;
    `)
    check('badge giỏ hàng cập nhật', badge?.includes('1 sản phẩm'), String(badge))

    await goto('/gio-hang')
    const cart = await text()
    check('trang giỏ hàng hiện sản phẩm', cart.includes('Bom mỹ') && cart.includes('180.000₫'))

    // ---- 4. Thanh toán ----
    console.log('\n4. Thanh toán')
    await goto('/thanh-toan')
    await evaluate(`
      const set = (name, value) => {
        const el = document.querySelector('[name="' + name + '"]');
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
        Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('customerName', 'Nguyễn Văn Test');
      set('phone', '0912345678');
      set('email', 'test@halona.vn');
      set('address', '123 Phạm Văn Bạch, P.15, Tân Bình, TP.HCM');
      set('note', 'Giao giờ hành chính');
      return true;
    `)
    await evaluate(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Đặt hàng')).click();
      return true;
    `)
    await sleep(3500)
    const afterOrder = await url()
    check('đặt hàng chuyển tới trang cảm ơn', afterOrder.startsWith('/dat-hang-thanh-cong/'), afterOrder)
    const success = await text()
    check('trang cảm ơn hiện mã đơn', /HL-[0-9A-F]{6}/.test(success))
    check('trang cảm ơn hiện đúng tổng tiền', success.includes('180.000₫'))
    await sleep(600)
    const clearedBadge = await evaluate(`
      const el = document.querySelector('[aria-label^="Giỏ hàng,"]');
      return el ? el.getAttribute('aria-label') : null;
    `)
    check('giỏ hàng được dọn sau khi đặt', clearedBadge?.includes('0 sản phẩm'), String(clearedBadge))

    // ---- 5. Đăng nhập ----
    console.log('\n5. Tài khoản')
    await goto('/tai-khoan/dang-nhap')
    await evaluate(`
      const set = (id, value) => {
        const el = document.getElementById(id);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('login-email', 'khachhang@halona.vn');
      set('login-password', 'khach123');
      document.getElementById('login-email').form.querySelector('button[type="submit"]').click();
      return true;
    `)
    await sleep(3000)
    check('đăng nhập thành công', (await url()) === '/tai-khoan', await url())
    // innerText trả về chữ đã qua text-transform, nên đối chiếu bằng email ở thẻ thống kê.
    check('trang tài khoản hiện đúng người dùng', (await text()).includes('khachhang@halona.vn'))

    // Đặt thêm một đơn khi ĐÃ đăng nhập để kiểm tra đơn gắn đúng vào tài khoản.
    await goto('/san-pham/tao-nhap-khau')
    await evaluate(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Thêm vào giỏ hàng')).click();
      return true;
    `)
    await sleep(800)
    await goto('/thanh-toan')
    const prefilled = await evaluate('return document.querySelector(\'[name="email"]\').value')
    check('thanh toán điền sẵn thông tin người đăng nhập', prefilled === 'khachhang@halona.vn', prefilled)
    await evaluate(`
      const set = (name, value) => {
        const el = document.querySelector('[name="' + name + '"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('phone', '0912345678');
      set('address', '12 Phạm Văn Bạch, P.15, Tân Bình, TP.HCM');
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Đặt hàng')).click();
      return true;
    `)
    await sleep(3500)
    const memberOrder = (await url()).replace('/dat-hang-thanh-cong/', '')
    check('đặt hàng khi đã đăng nhập thành công', /^HL-[0-9A-F]{6}$/.test(memberOrder), memberOrder)

    await goto('/tai-khoan/don-hang')
    const myOrders = await text()
    check('đơn vừa đặt xuất hiện trong tài khoản', myOrders.includes(memberOrder), memberOrder)
    check('đơn hiện trạng thái chờ xác nhận', myOrders.includes('Chờ xác nhận'))

    await goto(`/tai-khoan/don-hang/${memberOrder}`)
    check('xem được chi tiết đơn của mình', (await text()).includes('Táo nhập khẩu'))

    // ---- 6. Tìm kiếm ----
    console.log('\n6. Tìm kiếm & blog')
    await goto('/tim-kiem?q=' + encodeURIComponent('vải'))
    check('tìm kiếm trả đúng sản phẩm', (await text()).includes('Vải nhập khẩu'))

    await goto('/tin-tuc')
    check('trang tin tức liệt kê bài', (await text()).includes('Kỹ thuật trồng rau sạch'))
    await goto('/tin-tuc/ky-thuat-trong-rau-sach-trong-chau-xop-tai-nha-don-gian')
    const post = await text()
    check('bài viết hiện toàn văn', post.length > 1200 && post.includes('thùng xốp'))

    // ---- 7. Form liên hệ ----
    console.log('\n7. Liên hệ')
    await goto('/lien-he')
    await evaluate(`
      const set = (id, value) => {
        const el = document.getElementById(id);
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
        Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('contact-name', 'Trần Thị Test');
      set('contact-email', 'lienhe@test.vn');
      set('contact-phone', '0987654321');
      set('contact-message', 'Tôi muốn hỏi về đơn hàng sỉ cho cửa hàng của mình.');
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Gửi liên hệ')).click();
      return true;
    `)
    await sleep(3000)
    check('gửi liên hệ thành công', (await text()).includes('Cảm ơn bạn!'))

    // ---- 8. Quản trị ----
    console.log('\n8. Quản trị')
    await goto('/tai-khoan/dang-nhap')
    // Đang đăng nhập bằng tài khoản khách -> bị chuyển về /tai-khoan, cần đăng xuất trước.
    if ((await url()) === '/tai-khoan') {
      await evaluate(`
        [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Đăng xuất').click();
        return true;
      `)
      await sleep(2500)
      await goto('/tai-khoan/dang-nhap')
    }
    await evaluate(`
      const set = (id, value) => {
        const el = document.getElementById(id);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('login-email', 'admin@halona.vn');
      set('login-password', 'admin123');
      document.getElementById('login-email').form.querySelector('button[type="submit"]').click();
      return true;
    `)
    await sleep(3000)
    check('admin đăng nhập vào /admin', (await url()) === '/admin', await url())

    const dash = await text()
    check('dashboard hiện thống kê', dash.includes('TỔNG QUAN') && dash.includes('Doanh thu'))
    check('dashboard hiện đơn vừa đặt', /HL-[0-9A-F]{6}/.test(dash))

    await goto('/admin/don-hang')
    check('quản trị đơn hàng hiện đơn', (await text()).includes('Nguyễn Văn Test'))

    await goto('/admin/lien-he')
    check('quản trị liên hệ hiện tin nhắn', (await text()).includes('Trần Thị Test'))

    // Sửa giá sản phẩm và kiểm tra phía người dùng.
    await goto('/admin/san-pham')
    check('quản trị sản phẩm liệt kê 4 SP', (await text()).includes('Bom mỹ'))
    const editHref = await evaluate(`
      const a = [...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Sửa');
      return a ? a.getAttribute('href') : null;
    `)
    await goto(editHref)
    await evaluate(`
      const el = document.querySelector('[name="salePrice"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '111000');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Cập nhật sản phẩm')).click();
      return true;
    `)
    await sleep(3500)
    check('lưu sản phẩm quay lại danh sách', (await url()) === '/admin/san-pham', await url())

    await goto('/san-pham/bom-my')
    check('giá mới hiện ở trang người dùng', (await text()).includes('111.000₫'))

    // Trả lại giá gốc để dữ liệu demo không bị lệch.
    await goto(editHref)
    await evaluate(`
      const el = document.querySelector('[name="salePrice"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '180000');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Cập nhật sản phẩm')).click();
      return true;
    `)
    await sleep(3000)

    // ---- 9. Responsive ----
    console.log('\n9. Responsive (375px)')
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await goto('/')
    const overflow = await evaluate(
      'return document.documentElement.scrollWidth - document.documentElement.clientWidth',
    )
    check('không tràn ngang ở 375px', overflow <= 1, `thừa ${overflow}px`)
    const menuBtn = await evaluate(
      'return Boolean([...document.querySelectorAll("button")].find(b => b.getAttribute("aria-label") === "Mở menu"))',
    )
    check('hiện nút menu mobile', menuBtn === true)
    await send('Emulation.clearDeviceMetricsOverride')

    // ---- 10. 404 ----
    console.log('\n10. Trang lỗi')
    await goto('/khong-ton-tai-dau-ca')
    check('trang 404 hiển thị đúng', (await text()).includes('404'))
  } finally {
    ws.close()
    chrome.kill()
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Kết quả: ${passed} đạt, ${failed} lỗi`)
  if (failures.length) {
    console.log('\nCác mục lỗi:')
    for (const f of failures) console.log(`  • ${f}`)
  }
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('\nLỗi khi chạy kiểm thử:', err.message)
  process.exit(1)
})
