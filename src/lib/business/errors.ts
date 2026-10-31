export function businessMessage(error:unknown){
 if(error&&typeof error==='object'&&'code'in error){const code=String(error.code);if(code==='P2002')return 'That phone, SKU, barcode or bill reference is already in use.';if(code==='P2025')return 'This record is no longer available. Refresh the page.';if(code.startsWith('P'))return 'The database could not complete this request. Refresh and retry.';}
 return error instanceof Error?error.message:'Could not complete the request.';
}
