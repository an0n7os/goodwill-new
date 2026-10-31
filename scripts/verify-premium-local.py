import sqlite3,json,urllib.request,urllib.error,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
c=sqlite3.connect((root/'dev.db').as_uri()+'?mode=ro',uri=True)
tables={r[0] for r in c.execute("select name from sqlite_master where type='table'")}
safety={'products':c.execute('select count(*) from Product').fetchone()[0],'orders':c.execute('select count(*) from "Order"').fetchone()[0],'new_workflow_tables':len(tables & {'Supplier','Purchase','ReturnEntry','Quotation','PaymentAttempt','Notification','RecoveryToken'}),'qa_admin_accounts':c.execute("select count(*) from AdminUser where email like 'qa-%'").fetchone()[0],'product_has_barcode':'barcode' in {r[1] for r in c.execute('pragma table_info(Product)')}}
c.close()
assert safety==json.loads((root/'imports/workflow-real-db-safety.json').read_text()),safety
checks=[]
for route in ['/products','/recover','/robots.txt','/sitemap.xml','/product/legrand-myrius-16a-power-socket','/api/media/ef4975b1-0612-4600-b269-47194fc4ef95.webp','/api/admin/recovery/restore-27b9c218-696a-4f35-b779-2481966ba596.db']:
 t=time.perf_counter()
 try:
  with urllib.request.urlopen('http://localhost:3031'+route,timeout=20) as r: code=r.status;body=r.read();content=r.headers.get('Content-Type','')
 except urllib.error.HTTPError as e: code=e.code;body=e.read();content=e.headers.get('Content-Type','')
 row={'route':route,'status':code,'ms':round((time.perf_counter()-t)*1000),'contentType':content}
 if route=='/robots.txt': assert b'Disallow: /' in body
 if route=='/recover': assert b'noindex' in body
 if route.startswith('/product/'): row['product_json_ld']=b'application/ld+json' in body;assert row['product_json_ld']
 if '/recovery/' in route: assert code==403
 else: assert code==200,row
 checks.append(row)
result={'real_database_unchanged':safety,'http':checks}
(root/'imports/premium-final-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
