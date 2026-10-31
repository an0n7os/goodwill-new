import sqlite3,json,time,urllib.request,urllib.error
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse
root=Path(__file__).resolve().parents[1]
base='http://localhost:3031'
class Links(HTMLParser):
 def __init__(self): super().__init__();self.links=set()
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   href=dict(attrs).get('href','')
   if href.startswith('/') and not href.startswith('//'):self.links.add(href.split('#')[0])
def fetch(route):
 t=time.perf_counter()
 try:
  with urllib.request.urlopen(base+route,timeout=30) as r:return {'route':route,'status':r.status,'ms':round((time.perf_counter()-t)*1000),'final':r.url},r.read().decode('utf8',errors='replace')
 except urllib.error.HTTPError as e:return {'route':route,'status':e.code},''
result={'database':{},'pages':[],'images':[]}
for name in ['dev.db','imports/workflow-schema-check.db']:
 c=sqlite3.connect((root/name).as_uri()+'?mode=ro',uri=True)
 result['database'][name]={'integrity':c.execute('pragma integrity_check').fetchone()[0],'foreign_key_errors':len(c.execute('pragma foreign_key_check').fetchall()),'products':c.execute('select count(*) from Product').fetchone()[0],'missing_images':c.execute('select count(*) from Product p where not exists(select 1 from ProductImage i where i.productId=p.id)').fetchone()[0],'negative_stock':c.execute('select count(*) from Product where stock<0').fetchone()[0],'duplicate_sku_groups':len(c.execute('select sku from Product group by sku having count(*)>1').fetchall()),'duplicate_name_groups':len(c.execute('select name from Product group by name having count(*)>1').fetchall())}
 if name.startswith('imports/'):
  slugs=[r[0] for r in c.execute('select slug from Product where isActive=1')]
  images=[r[0] for r in c.execute('select distinct url from ProductImage')]
 c.close()
routes={'/','/products','/cart','/checkout','/account','/recover','/track-order','/bulk-enquiry','/terms','/privacy-policy','/refund-policy','/delivery-policy','/warranty'}
for route in ['/','/products']:
 row,body=fetch(route);p=Links();p.feed(body);routes.update(x for x in p.links if x and not x.startswith('/admin') and not x.startswith('/api'))
routes.update('/product/'+s for s in slugs)
for route in sorted(routes):
 row,body=fetch(route);row['error_page']='Something went wrong' in body;result['pages'].append(row)
for url in images:
 if url.startswith('/'):
  row,_=fetch(url);result['images'].append(row)
 else:result['images'].append({'route':url,'status':'external-not-checked'})
(root/'imports/audit-readonly-results.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps({'database':result['database'],'pages_checked':len(result['pages']),'page_failures':[r for r in result['pages'] if r['status']!=200 or r['error_page']],'images_checked':len(images),'image_failures':[r for r in result['images'] if r['status']!=200]},indent=2))
