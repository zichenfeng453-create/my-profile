(function () {
  let data = null;

  /* ===== 加载数据 ===== */
  async function loadData() {
    try {
      const res = await fetch('data.json');
      data = await res.json();
    } catch (e) {
      // 使用内嵌默认数据
      data = getDefaultData();
    }
    renderAll();
  }

  function getDefaultData() {
    return {
      basic: { name: '', englishName: '', avatar: '', bio: '', location: '', occupation: '', tags: [], phone: '', wechat: '', qq: '', douyin: '', bilibili: '', email: '' },
      gallery: [],
      timeline: []
    };
  }

  /* ===== 渲染全部 ===== */
  function renderAll() {
    renderProfile();
    renderGallery();
    renderTimeline();
  }

  /* ===== 个人名片区 ===== */
  function renderProfile() {
    var b = data.basic;

    // 头像
    var avatar = document.getElementById('profile-avatar');
    if (b.avatar) {
      avatar.src = b.avatar;
    } else {
      avatar.removeAttribute('src');
    }

    document.getElementById('profile-name').textContent = b.name || '你的名字';
    document.getElementById('profile-english-name').textContent = b.englishName || '';
    document.getElementById('profile-bio').textContent = b.bio || '';

    // 身份标签（location + occupation + 自定义tags）
    var tagsContainer = document.getElementById('profile-tags-container');
    tagsContainer.innerHTML = '';
    var allTags = [];
    if (b.location) allTags.push({ text: b.location, cls: '' });
    if (b.occupation) allTags.push({ text: b.occupation, cls: '' });
    (b.tags || []).forEach(function (t) { allTags.push({ text: t, cls: 'tag-identity' }); });
    allTags.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'tag' + (t.cls ? ' ' + t.cls : '');
      span.textContent = t.text;
      tagsContainer.appendChild(span);
    });

    // 复制按钮
    setupCopyBtn('btn-phone', b.phone);
    setupCopyBtn('btn-wechat', b.wechat);
    setupCopyBtn('btn-qq', b.qq);
    setupCopyBtn('btn-douyin', b.douyin);
    setupCopyBtn('btn-bilibili', b.bilibili);

    // 邮件按钮
    var emailBtn = document.getElementById('btn-email');
    if (b.email) {
      emailBtn.href = 'mailto:' + b.email;
    }
  }

  function setupCopyBtn(id, text) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute('data-copy', text || '');
    btn.addEventListener('click', function () {
      var content = btn.getAttribute('data-copy');
      if (!content) return;
      copyToClipboard(content);
      btn.classList.add('copied');
      var label = btn.querySelector('.btn-label');
      var orig = label.textContent;
      label.textContent = '已复制 ✓';
      setTimeout(function () {
        btn.classList.remove('copied');
        label.textContent = orig;
      }, 1800);
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ===== 摄影作品集 ===== */
  function renderGallery() {
    var items = data.gallery || [];
    var cats = ['全部'];
    items.forEach(function (item) {
      if (item.category && cats.indexOf(item.category) === -1) {
        cats.push(item.category);
      }
    });

    // 分类过滤按钮
    var filterDiv = document.getElementById('gallery-filters');
    filterDiv.innerHTML = '';
    cats.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'gallery-filter' + (cat === '全部' ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        filterDiv.querySelectorAll('.gallery-filter').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGalleryItems(items, cat);
      });
      filterDiv.appendChild(btn);
    });

    renderGalleryItems(items, '全部');
  }

  function renderGalleryItems(items, filter) {
    var grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    var filtered = filter === '全部' ? items : items.filter(function (i) { return i.category === filter; });

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:var(--color-text-lighter);grid-column:1/-1;padding:40px;">暂无作品</p>';
      return;
    }

    filtered.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'gallery-item';

      // 图片容器 + 透明防下载遮罩
      var imgWrap = document.createElement('div');
      imgWrap.className = 'gallery-img-wrap';
      imgWrap.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      if (item.src) {
        var img = document.createElement('img');
        img.className = 'gallery-item-img';
        img.src = item.src;
        img.alt = item.title || '';
        img.loading = 'lazy';
        img.draggable = false;
        imgWrap.appendChild(img);
      } else {
        var ph = document.createElement('div');
        ph.className = 'gallery-item-placeholder';
        ph.textContent = '🖼️';
        imgWrap.appendChild(ph);
      }
      card.appendChild(imgWrap);

      var info = document.createElement('div');
      info.className = 'gallery-item-info';
      info.innerHTML =
        '<div class="gallery-item-title">' + escapeHtml(item.title || '') + '</div>' +
        '<div class="gallery-item-desc">' + escapeHtml(item.description || '') + '</div>' +
        (item.category ? '<span class="gallery-item-category">' + escapeHtml(item.category) + '</span>' : '');
      card.appendChild(info);

      card.addEventListener('click', function () { openLightbox(item); });
      grid.appendChild(card);
    });
  }

  /* ===== Lightbox ===== */
  function openLightbox(item) {
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    var info = document.getElementById('lightbox-info');

    if (item.src) {
      img.src = item.src;
      img.alt = item.title || '';
      img.style.display = '';
      img.draggable = false;
    } else {
      img.style.display = 'none';
    }

    info.innerHTML =
      (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
      (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '');

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('lightbox').addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ===== 成长生涯时间线 ===== */
  function renderTimeline() {
    var items = data.timeline || [];
    var list = document.getElementById('timeline-list');
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--color-text-lighter);padding:40px;">暂无记录</p>';
      return;
    }

    // 按日期排序
    items.sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });

    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML =
        '<div class="timeline-dot ' + (item.type || 'other') + '"></div>' +
        '<div class="timeline-date">' + escapeHtml(item.date || '') + '</div>' +
        '<div class="timeline-title">' + escapeHtml(item.title || '') + '</div>' +
        '<div class="timeline-desc">' + escapeHtml(item.description || '') + '</div>' +
        (item.image ? '<img class="timeline-image" src="' + escapeAttr(item.image) + '" alt="" draggable="false" oncontextmenu="return false;">' : '');
      list.appendChild(div);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ===== 启动 ===== */
  loadData();
})();
