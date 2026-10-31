import {db} from "./db";
export {deliveryQuote,DEFAULT_DELIVERY_RULES} from "./deliveryRules";
export type {DeliveryRule} from "./deliveryRules";
export async function readDeliveryRules(){return db.deliveryZone.findMany({orderBy:{id:'asc'}});}
