import { BANK_ACCOUNT } from '@/components/cart/BankTransferInfo'

/**
 * Ảnh VietQR động do img.vietqr.io sinh: quét là app ngân hàng điền sẵn số tiền và
 * nội dung (= mã đơn) nên admin đối chiếu được từng đơn. Một số app ngân hàng bỏ dấu
 * gạch ngang trong nội dung, khi đối chiếu nên so phần chữ-số.
 */
export function vietQrUrl(amount: number, addInfo: string): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: BANK_ACCOUNT.holder,
  })
  return `https://img.vietqr.io/image/MB-${BANK_ACCOUNT.number}-compact2.png?${params}`
}
