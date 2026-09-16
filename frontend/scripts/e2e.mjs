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
  // Profile Chrome ở trên dùng lại một thư mục cố định nên cookie và localStorage sống
  // sót qua các lần chạy: lần chạy sau sẽ vào /tai-khoan/dang-nhap trong trạng thái đã
  // đăng nhập (mục 5 hỏng) và giỏ hàng còn hàng cũ (mục 3 đếm sai). Dọn sạch để mỗi lần
  // chạy đều bắt đầu từ một trình duyệt trắng.
  await send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' })

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
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'lỗi khi evaluate')
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
    // Thanh menu desktop ẩn ở 800px mặc định của Chrome headless nên innerText không thấy;
    // đọc textContent của các link trong DOM (dropdown chỉ ẩn bằng CSS, link vẫn có sẵn).
    const menu = await evaluate(
      "return [...document.querySelectorAll('header nav a')].map(a => a.textContent.trim())",
    )
    check(
      'menu chính có 3 nhóm danh mục',
      ['Quà tặng trái cây', 'Sản phẩm', 'Trái cây tươi hàng ngày'].every((t) => menu.includes(t)),
      menu.join(' | '),
    )
    check(
      'nhóm "Sản phẩm" liệt kê đủ 5 danh mục con',
      ['Trái cây nhập khẩu', 'Trái cây nội địa', 'Nước ép trái cây', 'Các loại hạt dinh dưỡng', 'Các loại rau củ quả Oragnic'].every((t) => menu.includes(t)),
    )
    const crumbs = await evaluate("return document.querySelector('nav[aria-label=\"Breadcrumb\"]').innerText")
    check('breadcrumb danh mục con hiện danh mục cha', crumbs.includes('Sản phẩm') && crumbs.includes('Trái cây nhập khẩu'), crumbs)
    await goto('/danh-muc-san-pham/san-pham')
    const parentPage = await text()
    check(
      'danh mục cha gom sản phẩm của các danh mục con, không trùng',
      parentPage.includes('Bom mỹ') && parentPage.includes('Cà chua Đà Lạt') && parentPage.includes('trên 4 sản phẩm'),
    )
    await goto('/danh-muc-san-pham/qua-tang-trai-cay')
    const giftPage = await text()
    check(
      'danh mục mới hiện sản phẩm mẫu',
      giftPage.includes('Giỏ quà trái cây thượng hạng') && giftPage.includes('Giỏ quà Tết sum vầy') && giftPage.includes('trên 4 sản phẩm'),
    )
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
    // Khách vãng lai không chia sẻ vị trí: tự chọn cửa hàng, phí áp mức chuẩn 30.000₫.
    await evaluate(`
      [...document.querySelectorAll('input[name="storeId"]')]
        .find(i => i.closest('label').textContent.includes('120 Yên Lãng')).click();
      return true;
    `)
    await sleep(300)
    check('chọn cửa hàng tay thì áp phí chuẩn', (await text()).includes('210.000₫'))
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
    const guestOrder = afterOrder.replace('/dat-hang-thanh-cong/', '') // Bom mỹ × 1, dùng ở mục 8b
    const success = await text()
    check('trang cảm ơn hiện mã đơn', /HL-[0-9A-F]{6}/.test(success))
    check('trang cảm ơn hiện đúng tổng tiền', success.includes('180.000₫') && success.includes('210.000₫'))
    check(
      'trang cảm ơn hiện cửa hàng và phí giao hàng',
      success.includes('120 Yên Lãng') && success.includes('Phí giao hàng') && success.includes('30.000₫'),
    )
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

    // Giả lập định vị ngay trong trang (không đi qua hộp thoại xin quyền của Chrome):
    // toạ độ gần 120 Yên Lãng → hệ thống phải tự chọn cửa hàng đó và áp bậc phí ≤3 km.
    await evaluate(`
      navigator.geolocation.getCurrentPosition = (ok) =>
        ok({ coords: { latitude: 21.0115, longitude: 105.816 } });
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Dùng vị trí của tôi')).click();
      return true;
    `)
    let nearest = null
    for (let i = 0; i < 10; i++) {
      await sleep(500)
      nearest = await evaluate(`
        const el = document.querySelector('input[name="storeId"]:checked');
        return el ? el.closest('label').innerText : null;
      `)
      if (nearest?.includes('Cách')) break
    }
    check(
      'định vị chọn đúng cửa hàng gần nhất',
      nearest?.includes('120 Yên Lãng') && nearest.includes('15.000₫'),
      String(nearest),
    )
    check('tổng cộng gồm phí theo khoảng cách', (await text()).includes('45.000₫'))
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
    const memberDetail = await text()
    check('xem được chi tiết đơn của mình', memberDetail.includes('Táo nhập khẩu'))
    check(
      'chi tiết đơn hiện cửa hàng và phí theo khoảng cách',
      memberDetail.includes('120 Yên Lãng') && memberDetail.includes('15.000₫') && memberDetail.includes('45.000₫'),
    )

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
    const contactPage = await text()
    check(
      'trang liên hệ liệt kê hệ thống cửa hàng',
      contactPage.includes('120 Yên Lãng') && contactPage.includes('ngõ 38') && contactPage.includes('Phạm Văn Bạch'),
    )
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
    const adminOrders = await text()
    check('quản trị đơn hàng hiện đơn', adminOrders.includes('Nguyễn Văn Test'))
    check('quản trị đơn hàng hiện cửa hàng giao', adminOrders.includes('Cửa hàng giao') && adminOrders.includes('120 Yên Lãng'))

    await goto('/admin/lien-he')
    check('quản trị liên hệ hiện tin nhắn', (await text()).includes('Trần Thị Test'))

    // Sửa giá sản phẩm và kiểm tra phía người dùng.
    await goto('/admin/san-pham')
    check('quản trị sản phẩm liệt kê sản phẩm', (await text()).includes('Bom mỹ'))
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

    // ---- 8b. Tồn kho ----
    // Kho chỉ trừ khi đơn COD hoàn thành (hoặc admin nhận tiền đơn BANK), hoàn lại khi huỷ.
    console.log('\n8b. Tồn kho')
    // Cột "Tồn kho" là td thứ 4 của /admin/san-pham; tìm dòng theo "/slug" để không khớp nhầm tên.
    const readStock = (slug) =>
      evaluate(`
        const row = [...document.querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('/${slug}'));
        return row ? Number(row.querySelectorAll('td')[3].innerText.trim()) : null;
      `)
    // Ô chọn trạng thái là uncontrolled trong <form action>: gán .value rồi bấm Lưu là đủ.
    const setOrderStatus = async (code, status) => {
      await goto('/admin/don-hang')
      await evaluate(`
        const card = [...document.querySelectorAll('article')].find(a => a.innerText.includes('${code}'));
        card.querySelector('select[name="status"]').value = '${status}';
        [...card.querySelectorAll('button')].find(b => b.textContent.trim() === 'Lưu').click();
        return true;
      `)
      await sleep(3000)
    }
    const orderHeader = (code) =>
      evaluate(`
        const card = [...document.querySelectorAll('article')].find(a => a.innerText.includes('${code}'));
        return card ? card.querySelector('header').innerText : null;
      `)

    await goto('/admin/san-pham')
    const stockBefore = await readStock('tao-nhap-khau')
    check('đọc được tồn kho Táo nhập khẩu', Number.isInteger(stockBefore), String(stockBefore))

    await setOrderStatus(memberOrder, 'COMPLETED')
    check('đơn COD chuyển sang Hoàn thành', (await orderHeader(memberOrder))?.includes('Hoàn thành'))
    await goto('/admin/san-pham')
    check('hoàn thành đơn COD trừ tồn kho', (await readStock('tao-nhap-khau')) === stockBefore - 1)

    await setOrderStatus(memberOrder, 'PENDING')
    await setOrderStatus(memberOrder, 'COMPLETED')
    await goto('/admin/san-pham')
    check('xác nhận lại không trừ kho lần hai', (await readStock('tao-nhap-khau')) === stockBefore - 1)

    await setOrderStatus(memberOrder, 'CANCELLED')
    await goto('/admin/san-pham')
    check('huỷ đơn đã trừ kho thì hoàn lại', (await readStock('tao-nhap-khau')) === stockBefore)
    await setOrderStatus(memberOrder, 'PENDING') // trả đơn về trạng thái ban đầu

    // Bỏ Bom mỹ vào giỏ trước khi hết hàng để lát nữa thử đặt hàng với giỏ cũ.
    await goto('/san-pham/bom-my')
    await evaluate(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Thêm vào giỏ hàng')).click();
      return true;
    `)
    await sleep(800)

    // Đặt tồn kho Bom mỹ = 0 qua form sửa (cùng cách với salePrice ở trên), nhớ giá trị cũ.
    await goto(editHref)
    const bomStock = await evaluate('return document.querySelector(\'[name="stock"]\').value')
    const setStock = async (value) => {
      await goto(editHref)
      await evaluate(`
        const el = document.querySelector('[name="stock"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${value}');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        [...document.querySelectorAll('button')].find(b => b.textContent.includes('Cập nhật sản phẩm')).click();
        return true;
      `)
      await sleep(3000)
    }
    await setStock(0)

    // Hoàn thành đơn khách vãng lai (Bom mỹ × 1) khi kho = 0 → 400, banner lỗi, trạng thái giữ nguyên.
    await setOrderStatus(guestOrder, 'COMPLETED')
    const afterFail = await text()
    check('thiếu hàng thì hiện banner lỗi', afterFail.includes('Không đủ tồn kho') && afterFail.includes('Bom mỹ'))
    check('đơn thiếu hàng giữ nguyên Chờ xác nhận', (await orderHeader(guestOrder))?.includes('Chờ xác nhận'))

    await goto('/cua-hang')
    const bomCard = await evaluate(`
      const card = [...document.querySelectorAll('article')].find(a => a.innerText.includes('Bom mỹ'));
      return card ? { text: card.innerText, disabled: card.querySelector('button').disabled } : null;
    `)
    check(
      'card hết hàng hiện nhãn và khoá nút',
      bomCard?.text.includes('Hết hàng') && bomCard.disabled === true,
      JSON.stringify(bomCard),
    )

    await goto('/san-pham/bom-my')
    const soldOutBtn = await evaluate(`
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Hết hàng');
      return btn ? btn.disabled : null;
    `)
    check('trang chi tiết hết hàng khoá nút thêm vào giỏ', soldOutBtn === true)

    // Giỏ cũ còn Bom mỹ: đặt hàng bị từ chối, giỏ tự gỡ dòng hết hàng.
    await goto('/thanh-toan')
    await evaluate(`
      [...document.querySelectorAll('input[name="storeId"]')]
        .find(i => i.closest('label').textContent.includes('120 Yên Lãng')).click();
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
    const rejected = await text()
    check(
      'đặt hàng khi hết kho bị từ chối và giỏ tự gỡ',
      (await url()) === '/thanh-toan' && rejected.includes('không đủ hàng') && rejected.includes('Giỏ hàng đang trống'),
      await url(),
    )

    await setStock(bomStock) // trả tồn kho về như cũ

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

    // ---- 11. Trợ lý ảo ----
    // Chạy đúng ở cả hai trạng thái: chưa gắn GEMINI_API_KEY thì khung chat phải báo
    // lỗi cấu hình, có khoá thì phải hiện câu trả lời. Chỉ hỏng khi không có gì xảy ra.
    console.log('\n11. Trợ lý ảo')
    await goto('/')
    await evaluate(`
      document.querySelector('[aria-label="Mở trợ lý tư vấn Halona"]').click();
      return true;
    `)
    await sleep(900)
    const chat = await text()
    check('mở được khung trợ lý', chat.includes('TRỢ LÝ HALONA'))
    check('có lời chào tiếng Việt', chat.includes('Mình là trợ lý của Halona Fruist'))

    // Khách phải chọn chủ đề trước: bảng chọn có 4 nút, ô nhập bị khoá.
    const modeCount = 'return document.querySelectorAll("[data-chat-mode]").length'
    const inputDisabled = 'return document.querySelector("#halona-chat-input").disabled'
    check('hiện 4 nút chọn chủ đề', (await evaluate(modeCount)) === 4)
    check('chưa chọn chủ đề thì chưa gõ được', (await evaluate(inputDisabled)) === true)

    await evaluate(`
      document.querySelector('[data-chat-mode="product"]').click();
      return true;
    `)
    await sleep(300)
    check(
      'chọn chủ đề xong thì mở ô nhập',
      (await evaluate(inputDisabled)) === false && (await text()).includes('Chủ đề: Sản phẩm'),
    )

    await evaluate(`
      const el = document.querySelector('#halona-chat-input');
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, 'Táo nhập khẩu giá bao nhiêu?');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[aria-label="Gửi câu hỏi"]').click();
      return true;
    `)
    await sleep(800)
    check('hiện ngay bong bóng câu hỏi', (await text()).includes('Táo nhập khẩu giá bao nhiêu?'))

    let settled = false
    for (let i = 0; i < 30; i++) {
      await sleep(1000)
      settled = await evaluate(
        'return Boolean(document.querySelector("[data-chat-error]") || document.querySelector(\'[data-role="model"]\'))',
      )
      if (settled) break
    }
    check('trợ lý trả lời hoặc báo lỗi cấu hình rõ ràng', settled === true)

    // Đổi chủ đề giữa chừng: bảng chọn hiện lại nhưng lịch sử không mất.
    await evaluate(`
      document.querySelector('[data-chat-switch]').click();
      return true;
    `)
    await sleep(300)
    check(
      'Đổi chủ đề hiện lại bảng chọn',
      (await evaluate(modeCount)) === 4 && (await evaluate(inputDisabled)) === true,
    )
    check('đổi chủ đề vẫn giữ lịch sử', (await text()).includes('Táo nhập khẩu giá bao nhiêu?'))

    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    })
    await sleep(600)
    // innerText không chứa placeholder của textarea, nên kiểm bằng sự tồn tại của panel.
    check(
      'Escape đóng khung trợ lý',
      (await evaluate('return !document.querySelector("#halona-chat-panel")')) === true,
    )

    // ---- 12. Nhân sự ----
    // Admin tạo nhân viên bán hàng ở Tân Bình, đăng nhập bằng tài khoản đó để kiểm menu và
    // phạm vi cửa hàng, rồi khoá tài khoản (nghỉ việc). Tài khoản e2e để lại ở trạng thái
    // khoá — giống đơn hàng và tin nhắn liên hệ do e2e tạo, `python seed.py` sẽ dọn.
    // Đặt CUỐI CÙNG có chủ đích: sau khi đăng nhập tài khoản nhân viên qua form, Chrome
    // headless (profile thường, không phải ẩn danh) không chuyển `Input.dispatchKeyEvent`
    // tới trang nữa cho tới hết phiên — mục này chỉ thao tác bằng JS nên không sao, nhưng
    // mục 11 cần phím Escape thật nên phải chạy trước.
    console.log('\n12. Nhân sự')
    // Đổi tài khoản: xoá cookie phiên rồi điền form đăng nhập (id ở AuthForms.tsx).
    const loginAs = async (email, password) => {
      await send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' })
      await goto('/tai-khoan/dang-nhap')
      await evaluate(`
        const set = (id, value) => {
          const el = document.getElementById(id);
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        set('login-email', '${email}');
        set('login-password', '${password}');
        document.getElementById('login-email').form.querySelector('button[type="submit"]').click();
        return true;
      `)
      await sleep(3000)
    }
    // Menu quản trị là <nav> có mục "Tổng quan" (menu chính của site cũng có "Sản phẩm").
    const adminNavLabels = () =>
      evaluate(`
        const nav = [...document.querySelectorAll('nav')].find(n => n.innerText.includes('Tổng quan'));
        return nav ? [...nav.querySelectorAll('a')].map(a => a.textContent.trim()) : [];
      `)
    const staffRow = (email) =>
      evaluate(`
        const row = [...document.querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('${email}'));
        return row ? row.innerText : null;
      `)

    // Mục 8 đã đăng nhập admin nhưng vẫn đăng nhập lại cho mục này tự đứng được.
    await loginAs('admin@halona.vn', 'admin123')
    await goto('/admin/nhan-su')
    const staffList = await text()
    check('trang nhân sự liệt kê nhân viên seed', staffList.includes('thungan@halona.vn') && staffList.includes('Thu ngân'))
    check('admin không có nút khoá chính mình', !(await staffRow('admin@halona.vn'))?.includes('Khoá'))

    const staffEmail = `nv-${Date.now()}@halona.vn`
    await goto('/admin/nhan-su/moi')
    await evaluate(`
      const set = (name, value) => {
        const el = document.querySelector('[name="' + name + '"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('name', 'Nhân Viên E2E');
      set('email', '${staffEmail}');
      set('password', 'nv123456');
      // Ô chọn là controlled (React): gán qua setter gốc rồi bắn 'change' để state cập nhật.
      const pick = (name, match) => {
        const el = document.querySelector('select[name="' + name + '"]');
        const opt = [...el.options].find(o => o.textContent.includes(match));
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, opt.value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      pick('role', 'Nhân viên bán hàng');
      pick('storeId', 'Tân Bình');
      return true;
    `)
    await sleep(300)
    const checkedPerms = await evaluate(`
      return [...document.querySelectorAll('input[name="permissions"]:checked')].map(i => i.value);
    `)
    check(
      'chọn vai trò tự tick bộ quyền mặc định',
      checkedPerms.length === 5 && checkedPerms.includes('products.view') && !checkedPerms.includes('posts.view'),
      checkedPerms.join(','),
    )
    await evaluate(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Tạo tài khoản')).click();
      return true;
    `)
    await sleep(3500)
    check('tạo nhân viên quay lại danh sách', (await url()) === '/admin/nhan-su', await url())
    check('nhân viên mới hiện trong danh sách', (await staffRow(staffEmail))?.includes('Nhân viên bán hàng'))

    await loginAs(staffEmail, 'nv123456')
    check('nhân viên đăng nhập vào /admin', (await url()) === '/admin', await url())
    const navLabels = await adminNavLabels()
    check(
      'menu quản trị chỉ hiện mục có quyền',
      navLabels.includes('Sản phẩm') && navLabels.includes('Đơn hàng') && !navLabels.includes('Bài viết') && !navLabels.includes('Nhân sự'),
      navLabels.join(','),
    )
    await goto('/admin/bai-viet')
    check('vào trang không có quyền bị đưa về tổng quan', (await url()) === '/admin', await url())
    await goto('/admin/san-pham')
    const staffProducts = await text()
    check('chỉ xem sản phẩm, không có nút thêm/sửa', staffProducts.includes('Bom mỹ') && !staffProducts.includes('Thêm sản phẩm'))
    await goto('/admin/don-hang')
    check('nhân viên Tân Bình không thấy đơn của 120 Yên Lãng', (await text()).includes('Chưa có đơn hàng nào.'))

    await loginAs('thungan@halona.vn', 'thungan123')
    await goto('/admin/don-hang')
    check('thu ngân 120 Yên Lãng thấy đơn của cửa hàng mình', (await text()).includes('Nguyễn Văn Test'))

    await loginAs('admin@halona.vn', 'admin123')
    await goto('/admin/nhan-su')
    await evaluate(`
      const row = [...document.querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('${staffEmail}'));
      [...row.querySelectorAll('button')].find(b => b.textContent.trim() === 'Khoá').click();
      return true;
    `)
    await sleep(3000)
    check('khoá tài khoản đổi trạng thái', (await staffRow(staffEmail))?.includes('Đã khoá'))

    await loginAs(staffEmail, 'nv123456')
    check(
      'tài khoản bị khoá không đăng nhập được',
      (await url()) === '/tai-khoan/dang-nhap' && (await text()).includes('Tài khoản đã bị khoá'),
      await url(),
    )
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
