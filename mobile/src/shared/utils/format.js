// somewhere shared (ex: src/shared/utils/format.js)
export function formatPhoneKR(digits) {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`;
}
