export const fractionalUnit=(unit:string)=>['metre','meter','m','kg','litre','liter'].includes(unit.toLowerCase());
export const minimumQuantity=(unit:string)=>fractionalUnit(unit)?0.001:1;
