export function siteUrl(){return (process.env.BETTER_AUTH_URL||process.env.URL||'http://localhost:3000').replace(/\/$/,'');}
export function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export const testSite=()=>process.env.GOODWILL_WORKFLOW_TEST==='1';
