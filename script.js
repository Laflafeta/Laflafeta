// 1. إعدادات Firebase
const firebaseConfig = {
    databaseURL: "https://laflafita2-default-rtdb.firebaseio.com/",
    projectId: "laflafita2"
};

// تشغيل Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// الباسورد الافتراضي مشفر (lavalvita_boss)
const _0xHASH = "8e9e2b126017e923e3e04e9082a93b4f65c57b7f9f257b44760d66324905335c";

let pImg = "";

// --- وظائف عامة ---

function loadSocialLinks() {
    db.ref('social').on('value', (snap) => {
        const links = snap.val();
        if (links) {
            const wa = document.getElementById('link-whatsapp');
            const fb = document.getElementById('link-facebook');
            const ig = document.getElementById('link-instagram');
            const tk = document.getElementById('link-tiktok');

            if (wa && links.whatsapp) wa.href = "https://wa.me/" + links.whatsapp;
            if (fb && links.facebook) fb.href = links.facebook;
            if (ig && links.instagram) ig.href = links.instagram;
            if (tk && links.tiktok) tk.href = links.tiktok;

            if(document.getElementById('wa-val')) document.getElementById('wa-val').value = links.whatsapp || "";
            if(document.getElementById('fb-val')) document.getElementById('fb-val').value = links.facebook || "";
            if(document.getElementById('ig-val')) document.getElementById('ig-val').value = links.instagram || "";
            if(document.getElementById('tk-val')) document.getElementById('tk-val').value = links.tiktok || "";
        }
    });
}

function loadCategories() {
    const nav = document.getElementById('dynamic-cats');
    const sel = document.getElementById('p-cat-select');
    const manageList = document.getElementById('cats-manage-list');

    db.ref('categories').on('value', (snap) => {
        const categories = snap.val();
        
        if (nav) {
            if (!categories) {
                nav.innerHTML = `<p style="color: var(--dark-pink); font-size: 0.9rem; padding: 10px;">لا توجد أقسام متوفرة ✨</p>`;
            } else {
                nav.innerHTML = `<button class="active" onclick="renderProducts('الكل', this)">الكل</button>`;
                Object.values(categories).forEach(catName => {
                    nav.innerHTML += `<button onclick="renderProducts('${catName}', this)">${catName}</button>`;
                });
            }
        }

        if (sel) sel.innerHTML = "";
        if (manageList) manageList.innerHTML = "";
        
        if (categories) {
            Object.keys(categories).forEach(id => {
                const name = categories[id];
                if (sel) sel.innerHTML += `<option value="${name}">${name}</option>`;
                if (manageList) {
                    manageList.innerHTML += `
                        <div style="display:flex; justify-content:space-between; background:#fffcfd; padding:10px; margin-bottom:5px; border-radius:12px; border:1px solid #fff0f5;">
                            <span>${name}</span>
                            <i class="fas fa-trash-alt" style="color:#ef5350; cursor:pointer;" onclick="deleteCat('${id}')"></i>
                        </div>`;
                }
            });
        }
    });
}

// --- وظائف صفحة اليوزر (index.html) ---

function renderProducts(category = 'الكل', btn = null) {
    const display = document.getElementById('product-display');
    if(!display) return;

    if(btn) {
        document.querySelectorAll('.categories-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    db.ref('products').on('value', (snapshot) => {
        display.innerHTML = '';
        const data = snapshot.val();
        if(!data) {
            display.innerHTML = `<div class="no-data" style="grid-column: 1/-1; text-align:center;">قريباً.. منتجات جديدة ✨</div>`;
            return;
        }

        let hasProducts = false;
        Object.keys(data).forEach(id => {
            const p = data[id];
            if(category === 'الكل' || p.category === category) {
                hasProducts = true;
                
                // حساب حالة المخزون
                const totalStock = (parseInt(p.stock) || 0) + (parseInt(p.stockSm) || 0) + (parseInt(p.stockMd) || 0) + (parseInt(p.stockLg) || 0);
                const isOOS = totalStock <= 0;

                // 1. تحديد السعر الأصلي (أقل سعر متاح للمقاسات أو السعر الأساسي)
                let priceArray = [p.priceBase, p.priceSm, p.priceMd, p.priceLg]
                    .map(pr => parseFloat(pr))
                    .filter(pr => !isNaN(pr) && pr > 0);
                
                let minPrice = priceArray.length > 0 ? Math.min(...priceArray) : 0;
                
                // 2. جلب نسبة الخصم
                let discountPercent = parseFloat(p.discount) || 0;
                
                // 3. حساب السعر النهائي بعد الخصم
                let finalPrice = discountPercent > 0 
                    ? minPrice - (minPrice * (discountPercent / 100)) 
                    : minPrice;

                display.innerHTML += `
                    <div class="product-card" style="${isOOS ? 'opacity:0.7;' : ''}">
                        ${discountPercent > 0 && !isOOS ? `<div class="badge" style="background:red; color:white; position:absolute; padding:5px 10px; border-radius:0 15px 15px 0;">خصم ${discountPercent}%</div>` : ''}
                        <img src="${p.img || 'https://via.placeholder.com/300'}" alt="${p.name}">
                        <h3>${p.name}</h3>
                        
                        <p class="product-desc" style="font-size:0.8rem; color:#666; margin:5px 0;">${p.desc || ''}</p>
                        
                        <div class="price-container" style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 10px;">
                            ${isOOS ? 
                                `<span style="color:red; font-weight:bold;">نفدت الكمية ❌</span>` : 
                                `
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    ${discountPercent > 0 ? `<span class="price-old" style="text-decoration: line-through; color: #a1a1a1; font-size: 0.85rem;">${minPrice.toFixed(0)} ج.م</span>` : ''}
                                    <span class="price-new" style="color: var(--main-pink); font-weight: bold; font-size: 1.1rem;">${finalPrice.toFixed(0)} ج.م</span>
                                </div>
                                `
                            }
                        </div>
                        <button class="add-btn" ${isOOS ? 'disabled' : ''} onclick="addToCart('${id}', '${p.name}', ${finalPrice})">
                            ${isOOS ? 'غير متوفر' : 'أضف للسلة 🛒'}
                        </button>
                    </div>
                `;
            }
        });

        if(!hasProducts) {
            display.innerHTML = `<div class="no-data" style="grid-column: 1/-1; text-align:center;">لا توجد منتجات حالياً 🌸</div>`;
        }
    });
}

let cart = JSON.parse(localStorage.getItem('lavelvita_cart')) || [];

function addToCart(id, name, price) {
    cart.push({id, name, price: parseFloat(price), qty: 1});
    updateCartUI();
    alert(`تم إضافة ${name} للسلة 🎀`);
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    if(count) count.innerText = cart.length;
    localStorage.setItem('lavelvita_cart', JSON.stringify(cart));
}

// --- وظائف صفحة الأدمن (admin.html) ---

function tryLogin() {
    const input = document.getElementById('pass-val').value;
    const hashedInput = CryptoJS.SHA256(input).toString();
    db.ref('admin/password').once('value', snap => {
        const storedHash = snap.val() || _0xHASH;
        if (hashedInput === storedHash) {
            document.getElementById('login-overlay').style.display = 'none';
            sessionStorage.setItem('isAdmin', 'true');
            loadAdminData();
        } else { 
            alert("الباسورد خطأ يا قمر ⚠️");
        }
    });
}

function loadAdminData() {
    loadSocialLinks();
    loadCategories();
    
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('orders-list');
        if(!list) return;
        list.innerHTML = "";
        snap.forEach(c => {
            const o = c.val();
            let itemsHtml = o.items.map(i => `${i.name} (x${i.qty})`).join(' + ');
            list.innerHTML += `
                <div class="card" style="border-left:6px solid var(--main-pink)">
                    <b>👤 ${o.customer.name}</b>
                    <p>🛍️ ${itemsHtml}</p>
                    <p>💰 Total: ${o.total} ج.م</p>
                    <button class="btn-main" onclick="markDone('${c.key}')">تم الشحن ✅</button>
                </div>`;
        });
    });

    db.ref('products').on('value', snap => {
        const list = document.getElementById('my-products-list');
        if(!list) return;
        list.innerHTML = "";
        snap.forEach(c => {
            const p = c.val();
            const totalStock = (parseInt(p.stock) || 0) + (parseInt(p.stockSm) || 0) + (parseInt(p.stockMd) || 0) + (parseInt(p.stockLg) || 0);
            list.innerHTML += `
                <div class="card" style="display:flex; align-items:center; gap:15px;">
                    <img src="${p.img}" width="50" height="50" style="border-radius:10px;">
                    <div style="flex:1"><b>${p.name}</b><br><small>Stock: ${totalStock}</small></div>
                    <button class="btn-main btn-sm btn-delete" onclick="deleteProd('${c.key}')">🗑️</button>
                </div>`;
        });
    });
}

function saveProduct() {
    const name = document.getElementById('p-name').value;
    const desc = document.getElementById('p-desc') ? document.getElementById('p-desc').value : ""; 
    const useSm = document.getElementById('use-sm').checked;
    const useMd = document.getElementById('use-md').checked;
    const useLg = document.getElementById('use-lg').checked;
    const priceBaseInput = document.getElementById('p-price-base').value;
    const discountInput = document.getElementById('p-discount').value || 0;

    if(!name || !pImg) return alert("الاسم والصورة مطلوبين! 📸");

    const basePrice = parseFloat(priceBaseInput) || 0;
    const discount = parseFloat(discountInput) || 0;

    const data = {
        name: name,
        desc: desc,
        category: document.getElementById('p-cat-select').value,
        priceBase: basePrice,
        priceSm: useSm ? parseFloat(document.getElementById('p-price-sm').value) : null,
        priceMd: useMd ? parseFloat(document.getElementById('p-price-md').value) : null,
        priceLg: useLg ? parseFloat(document.getElementById('p-price-lg').value) : null,
        stockSm: useSm ? parseInt(document.getElementById('p-stock-sm').value || 0) : 0,
        stockMd: useMd ? parseInt(document.getElementById('p-stock-md').value || 0) : 0,
        stockLg: useLg ? parseInt(document.getElementById('p-stock-lg').value || 0) : 0,
        discount: discount,
        stock: parseInt(document.getElementById('p-stock').value || 0),
        img: pImg
    };

    db.ref('products').push(data).then(() => { 
        alert("تم النشر بنجاح! 🚀");
        location.reload();
    });
}

function saveCat() {
    const name = document.getElementById('c-name').value.trim();
    if(!name) return;
    db.ref('categories').push(name).then(() => { document.getElementById('c-name').value = ""; });
}

function deleteCat(id) { if(confirm("هل تريد حذف هذا القسم؟")) db.ref('categories/'+id).remove(); }
function deleteProd(id) { if(confirm("حذف المنتج؟")) db.ref('products/'+id).remove(); }

function markDone(id) {
    db.ref('orders/'+id).once('value', snap => {
        db.ref('archive').push(snap.val()).then(() => { 
            db.ref('orders/'+id).remove(); 
            alert("تم النقل للأرشيف 📦"); 
        });
    });
}

function updateSocial() {
    const socialData = {
        whatsapp: document.getElementById('wa-val').value,
        facebook: document.getElementById('fb-val').value,
        instagram: document.getElementById('ig-val').value,
        tiktok: document.getElementById('tk-val').value
    };
    db.ref('social').set(socialData).then(() => alert("تم حفظ الروابط ✅"));
}

const fileInput = document.getElementById('p-file');
if(fileInput) {
    fileInput.onchange = (e) => {
        const r = new FileReader(); 
        r.onload = (v) => { pImg = v.target.result; }; 
        r.readAsDataURL(e.target.files[0]);
    };
}

window.onload = () => {
    updateCartUI();
    loadSocialLinks();
    if(document.getElementById('product-display')) {
        loadCategories();
        renderProducts('الكل');
    }
    if(sessionStorage.getItem('isAdmin') === 'true') {
        if(document.getElementById('login-overlay')) document.getElementById('login-overlay').style.display = "none";
        loadAdminData();
    }
};