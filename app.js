const $ = id => document.getElementById(id);
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => n.toLocaleString('vi-VN');
const missing = v => esc(v || 'Chưa có thông tin');
let data, category = -1, page = 1, filtered = [], lastFocus;
const pageSize = 18;
function getFiltered(){
 const tokens = norm($('query').value).split(' ').filter(Boolean);
 const author=$('author').value, pub=$('publisher').value, year=$('year').value;
 let rows=data.books.filter(b => (category===-1 || b.category===category) && (!author || b.author===author) && (!pub || b.publisher===pub) && (!year || b.year===year) && tokens.every(t=>b.search.includes(t)));
 if($('sort').value==='az')rows.sort((a,b)=>a.title.localeCompare(b.title,'vi'));
 if($('sort').value==='new')rows.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||a.title.localeCompare(b.title,'vi'));
 return rows;
}
function updateOptions(){
 const rows=data.books.filter(b=>category===-1||b.category===category);
 for(const field of ['author','publisher','year']){
  const current=$(field).value;
  const vals=[...new Set(rows.map(b=>b[field]).filter(Boolean))].sort(field==='year'?(a,b)=>(Number(b)||0)-(Number(a)||0):(a,b)=>a.localeCompare(b,'vi'));
  const labels={author:'Tất cả tác giả',publisher:'Tất cả nhà xuất bản',year:'Tất cả các năm'};
  $(field).innerHTML=`<option value="">${labels[field]}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if(vals.includes(current))$(field).value=current;
 }
}
function renderNav(){
 const cats=[{id:-1,name:'Tất cả danh mục',entries:data.entries},...data.categories];
 $('categories').innerHTML=cats.map(c=>`<button class="cat ${c.id===category?'active':''}" type="button" data-category="${c.id}" aria-pressed="${c.id===category}"><span class="cat-symbol" aria-hidden="true">${c.id===-1?'▦':'▤'}</span><span>${esc(c.name)}</span><span class="cat-number">${fmt(c.entries)}</span></button>`).join('');
}
function render(){
 filtered=getFiltered();const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,totalPages);
 $('result-title').textContent=category===-1?'Tất cả danh mục':data.categories[category].name;
 const count=filtered.reduce((n,b)=>n+b.copies.length,0);
 $('summary').textContent=`${fmt(filtered.length)} kết quả · ${fmt(count)} bản ghi trong danh mục`;
 const rows=filtered.slice((page-1)*pageSize,page*pageSize);
 $('results').innerHTML=rows.length?rows.map(b=>`<article class="book" data-category="${b.category}"><div class="book-primary"><span class="book-icon" aria-hidden="true">${esc(data.categories[b.category].sheet.slice(0,2).toUpperCase())}</span><div><button class="book-title" type="button" data-book="${b.id}">${esc(b.title)}</button><p class="author">${missing(b.author)}</p><span class="chip">${esc(data.categories[b.category].name)}</span></div></div><div class="publication">${missing(b.publisher)}<span>${b.year?`Năm ${esc(b.year)}`:'Chưa có năm xuất bản'}</span></div><div class="book-count">${fmt(b.copies.length)} bản ghi<button class="detail-btn" type="button" data-book="${b.id}" aria-label="Chi tiết: ${esc(b.title)}">Xem chi tiết</button></div></article>`).join(''):`<div class="empty"><strong>Chưa tìm thấy sách phù hợp</strong>Thử từ khóa ngắn hơn hoặc xóa bộ lọc.<br><button class="primary" type="button" data-clear>Xóa tìm kiếm và bộ lọc</button></div>`;
 $('results').setAttribute('aria-busy','false');
 $('pagination').innerHTML=rows.length?`<span>Hiển thị ${fmt((page-1)*pageSize+1)}–${fmt(Math.min(page*pageSize,filtered.length))} / ${fmt(filtered.length)}</span><div class="pages"><button type="button" data-page="${page-1}" ${page===1?'disabled':''}>Trước</button><span>Trang ${page} / ${totalPages}</span><button type="button" data-page="${page+1}" ${page===totalPages?'disabled':''}>Sau</button></div>`:'';
}
function reset(){category=-1;page=1;for(const field of ['query','author','publisher','year'])$(field).value='';$('sort').value='source';updateOptions();renderNav();render();}
function showDetail(id){
 const b=data.books.find(x=>x.id===id);if(!b)return;lastFocus=document.activeElement;
 const cat=data.categories[b.category];
 $('detail-content').innerHTML=`<h2>${esc(b.title)}</h2><p class="author">${missing(b.author)}</p><span class="chip" data-category="${b.category}">${esc(cat.name)}</span><dl><dt>Nhà xuất bản</dt><dd>${missing(b.publisher)}</dd><dt>Nơi xuất bản</dt><dd>${missing(b.place)}</dd><dt>Năm xuất bản</dt><dd>${missing(b.year)}</dd><dt>Môn loại</dt><dd>${missing(b.classification)}</dd><dt>Mục trong file</dt><dd>${esc(cat.sheet)}</dd><dt>Số bản ghi</dt><dd>${fmt(b.copies.length)}</dd></dl><h3>Số đăng ký cá biệt</h3><div class="codes">${b.copies.map(c=>`<span title="Dòng ${c.row} trong sheet ${esc(cat.sheet)}">${esc(c.code)}</span>`).join('')}</div><p class="detail-note">Ghi lại số đăng ký để hỏi thư viện về cuốn sách này. Số bản ghi trong danh mục không xác nhận tình trạng còn sách để mượn.</p>`;
 $('detail').showModal();
}
$('search-form').addEventListener('submit',e=>{e.preventDefault();if(data){page=1;render();}});
let timer;$('query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(data){page=1;render();}},160);});
for(const id of ['author','publisher','year','sort'])$(id).addEventListener('change',()=>{if(data){page=1;render();}});
$('reset').addEventListener('click',()=>{if(data)reset();});
$('example').addEventListener('click',()=>{if(data){reset();$('query').value='tin hoc';render();$('query').focus();}});
$('categories').addEventListener('click',e=>{const el=e.target.closest('[data-category]');if(!el||!data)return;category=Number(el.dataset.category);page=1;updateOptions();renderNav();render();});
$('results').addEventListener('click',e=>{const el=e.target.closest('[data-book]');if(el)showDetail(el.dataset.book);if(e.target.closest('[data-clear]'))reset();if(e.target.closest('[data-retry]'))load();});
$('pagination').addEventListener('click',e=>{const el=e.target.closest('[data-page]');if(el&&!el.disabled){page=Number(el.dataset.page);render();$('result-title').scrollIntoView({block:'start',behavior:'instant'});}});
for(const id of ['close-detail','close-bottom'])$(id).addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('close',()=>lastFocus?.focus());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function load(){
 try{
  $('results').setAttribute('aria-busy','true');
  const response=await fetch('./catalog.json');if(!response.ok)throw Error('Không tải được dữ liệu');data=await response.json();
  data.books.forEach(b=>{b.search=norm([b.title,b.author,b.publisher,b.classification,...b.copies.map(c=>c.code)].join(' '));});
  updateOptions();renderNav();render();
  if(document.modelContext?.registerTool){
   try{await document.modelContext.registerTool({name:'search_catalog',title:'Tra cứu danh mục sách',description:'Áp dụng từ khóa và mục vào danh mục hiện tại, trả kết quả kèm mã đăng ký.',inputSchema:{type:'object',properties:{query:{type:'string'},category:{type:'string',enum:['Tất cả danh mục',...data.categories.map(c=>c.name)]}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.query!=='string'||(input.category!==undefined&&typeof input.category!=='string'))throw Error('Dữ liệu tra cứu không hợp lệ');const c=input.category?data.categories.find(c=>c.name===input.category):undefined;if(input.category&&input.category!=='Tất cả danh mục'&&!c)throw Error('Mục sách không hợp lệ');reset();category=c?.id??-1;$('query').value=input.query;updateOptions();renderNav();render();return{results:filtered.length,books:filtered.slice(0,10).map(b=>({title:b.title,author:b.author,category:data.categories[b.category].name,codes:b.copies.map(c=>c.code)}))};}});}catch(e){console.info('Tra cứu qua trình duyệt chưa được hỗ trợ',e);}
  }
 }catch(e){$('summary').textContent='Chưa tải được danh mục';$('results').setAttribute('aria-busy','false');$('results').innerHTML='<div class="empty"><strong>Không tải được dữ liệu sách</strong>Vui lòng kiểm tra kết nối và thử lại.<br><button class="primary" data-retry type="button">Thử lại</button></div>';}
}
load();
