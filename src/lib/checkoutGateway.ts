import {confirmOnlinePayment} from './paymentActions';
export type CheckoutPayment={orderId:string;orderNumber:string;providerOrderId:string;amount:number;keyId:string;access:string};
type Result={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
type Checkout={open():void;on(event:string,callback:()=>void):void};
declare global {interface Window {Razorpay?:new(options:Record<string,unknown>)=>Checkout}}
export async function openGateway(payment:CheckoutPayment,prefill:{name?:string;email?:string;contact?:string}){
 if(!window.Razorpay)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=()=>resolve();script.onerror=()=>reject(Error('Payment window could not load. Check your order before retrying.'));document.head.appendChild(script);});
 if(!window.Razorpay)throw Error('Payment window is unavailable.');
 return new Promise<{paid:boolean}>((resolve,reject)=>{const checkout=new window.Razorpay!({key:payment.keyId,amount:payment.amount,currency:'INR',name:'Goodwill Electrical World — TEST',order_id:payment.providerOrderId,prefill,handler:async(result:Result)=>{try{const verified=await confirmOnlinePayment({orderId:payment.orderId,access:payment.access,providerOrderId:result.razorpay_order_id,paymentId:result.razorpay_payment_id,signature:result.razorpay_signature});if(!verified.success)throw Error(verified.error);resolve({paid:verified.paid});}catch(e){reject(e);}},modal:{ondismiss:()=>resolve({paid:false})}});checkout.on('payment.failed',()=>resolve({paid:false}));checkout.open();});
}
