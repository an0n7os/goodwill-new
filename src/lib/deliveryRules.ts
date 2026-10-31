export type DeliveryRule={id:string;name:string;pincodes:string;charge:number;freeAbove:number|null;estimatedDays:number;isActive:boolean};
export const DEFAULT_DELIVERY_RULES:DeliveryRule[]=[
 {id:'local',name:'Kulappully & Shoranur',pincodes:'679121,679122,679123,679531',charge:80,freeAbove:1000,estimatedDays:1,isActive:true},
 {id:'nearby',name:'Nearby delivery area',pincodes:'679101-679599',charge:80,freeAbove:1000,estimatedDays:2,isActive:true},
];
export function pinMatches(pin:string,ranges:string){return ranges.split(',').some(raw=>{const token=raw.trim();if(/^\d{6}$/.test(token))return token===pin;const m=token.match(/^(\d{6})-(\d{6})$/);return !!m&&Number(pin)>=Number(m[1])&&Number(pin)<=Number(m[2]);});}
export function deliveryQuote(rules:DeliveryRule[],pin:string,subtotal=0,freeCoupon=false){
 if(!/^\d{6}$/.test(pin))return null;
 const matches=rules.filter(r=>r.isActive&&pinMatches(pin,r.pincodes)).sort((a,b)=>Number(!a.pincodes.split(',').map(s=>s.trim()).includes(pin))-Number(!b.pincodes.split(',').map(s=>s.trim()).includes(pin))||a.estimatedDays-b.estimatedDays||a.id.localeCompare(b.id));
 const rule=matches[0];if(!rule)return null;
 return {zoneId:rule.id,zoneName:rule.name,charge:freeCoupon||(rule.freeAbove!==null&&subtotal>=rule.freeAbove)?0:rule.charge,freeAbove:rule.freeAbove,baseCharge:rule.charge,estimatedDays:rule.estimatedDays,estimate:rule.estimatedDays===1?'usually same or next working day':`usually ${rule.estimatedDays} working days`};
}
