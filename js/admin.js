(function () {
  var ADMIN_PASSWORD = 'admin123';
  var data = null;
  var isLoggedIn = false;

  /* ===== DOM 引用 ===== */
  var loginScreen = document.getElementById('login-screen');
  var editorScreen = document.getElementById('editor-screen');
  var loginPassword = document.getElementById('login-password');
  var loginError = document.getElementById('login-error');
  var loginBtn = document.getElementById('login-btn');

  /* ===== 登录 ===== */
  loginBtn.addEventListener('click', doLogin);
  loginPassword.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
  });

  function doLogin() {
    var pw = loginPassword.value.trim();
    if (!pw) { showLoginError('请输入密码'); return; }
    if (pw !== ADMIN_PASSWORD) { showLoginError('密码错误'); return; }
    isLoggedIn = true;
    loginScreen.style.display = 'none';
    editorScreen.style.display = 'block';
    initEditor();
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginPassword.value = '';
    loginPassword.focus();
  }

  /* ===== 退出 ===== */
  document.getElementById('btn-logout').addEventListener('click', function () {
    isLoggedIn = false;
    loginScreen.style.display = 'flex';
    editorScreen.style.display = 'none';
    loginPassword.value = '';
    loginError.textContent = '';
  });

  /* ===== Tab 切换 ===== */
  document.querySelectorAll('.editor-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.editor-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      document.getElementById(target).classList.add('active');
    });
  });

  /* ===== 初始化编辑器 ===== */
  function initEditor() {
    loadDataFile().then(function () {
      renderBasicForm();
      renderGalleryEditor();
      renderTimelineEditor();
    });
  }

  function loadDataFile() {
    return fetch('data.json').then(function (r) { return r.json(); }).then(function (d) {
      data = d;
    }).catch(function () {
      data = getEmptyData();
    });
  }

  function getEmptyData() {
    return { basic: { name:'',englishName:'',avatar:'',bio:'',location:'',occupation:'',tags:[],phone:'',wechat:'',qq:'',douyin:'',bilibili:'',email:'' }, gallery: [], timeline: [] };
  }

  /* ===== 基本信息表单 ===== */
  function renderBasicForm() {
    var b = data.basic;
    setVal('ed-name', b.name);
    setVal('ed-english-name', b.englishName);
    setVal('ed-bio', b.bio);
    setVal('ed-location', b.location);
    setVal('ed-occupation', b.occupation);
    setVal('ed-tags', (b.tags || []).join(', '));
    setVal('ed-phone', b.phone);
    setVal('ed-wechat', b.wechat);
    setVal('ed-qq', b.qq);
    setVal('ed-douyin', b.douyin);
    setVal('ed-bilibili', b.bilibili);
    setVal('ed-email', b.email);
    updateAvatarPreview(b.avatar);

    document.getElementById('ed-avatar-file').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) { showToast('头像图片请控制在 500KB 以内'); return; }
      fileToBase64(file, function (b64) {
        data.basic.avatar = b64;
        updateAvatarPreview(b64);
      });
    });

    document.getElementById('ed-avatar-remove').addEventListener('click', function () {
      data.basic.avatar = '';
      updateAvatarPreview('');
      document.getElementById('ed-avatar-file').value = '';
    });
  }

  function updateAvatarPreview(src) {
    var img = document.getElementById('ed-avatar-preview');
    var ph = document.getElementById('ed-avatar-ph');
    if (src) {
      img.src = src; img.style.display = ''; ph.style.display = 'none';
    } else {
      img.style.display = 'none'; ph.style.display = '';
    }
  }

  function collectBasicForm() {
    data.basic.name = getVal('ed-name');
    data.basic.englishName = getVal('ed-english-name');
    data.basic.bio = getVal('ed-bio');
    data.basic.location = getVal('ed-location');
    data.basic.occupation = getVal('ed-occupation');
    data.basic.tags = getVal('ed-tags').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    data.basic.phone = getVal('ed-phone');
    data.basic.wechat = getVal('ed-wechat');
    data.basic.qq = getVal('ed-qq');
    data.basic.douyin = getVal('ed-douyin');
    data.basic.bilibili = getVal('ed-bilibili');
    data.basic.email = getVal('ed-email');
    var newPw = getVal('ed-password');
    if (newPw) ADMIN_PASSWORD = newPw;
  }

  /* ===== 摄影作品编辑 ===== */
  function renderGalleryEditor() {
    var list = document.getElementById('gallery-edit-list');
    list.innerHTML = '';
    (data.gallery || []).forEach(function (item, idx) {
      list.appendChild(createGalleryCard(item, idx));
    });
  }

  function createGalleryCard(item, idx) {
    var card = document.createElement('div');
    card.className = 'edit-card';
    card.dataset.idx = idx;

    var imgHTML = item.src
      ? '<img class="edit-card-img" src="' + escapeAttr(item.src) + '" alt="">'
      : '<div class="edit-card-img-placeholder">🖼️</div>';

    card.innerHTML =
      '<div class="edit-card-header">' +
      '<h3>作品 #' + (idx + 1) + '</h3>' +
      '<button class="btn btn-danger btn-sm delete-gallery">删除</button>' +
      '</div>' +
      '<div class="edit-card-body">' +
      imgHTML +
      '<input type="file" accept="image/*" class="gallery-file-input" style="font-size:0.85rem;">' +
      '<small style="color:var(--color-text-lighter);">图片建议控制在 1MB 以内</small>' +
      '<div class="form-row"><div class="form-group"><label>标题</label><input type="text" class="input gallery-title" value="' + escapeAttr(item.title || '') + '"></div>' +
      '<div class="form-group"><label>分类</label><input type="text" class="input gallery-cat" value="' + escapeAttr(item.category || '') + '" placeholder="如: 风光、人像、街拍"></div></div>' +
      '<div class="form-group"><label>描述</label><textarea class="input gallery-desc" rows="2">' + escapeHtml(item.description || '') + '</textarea></div>' +
      '</div>';

    // 删除按钮
    card.querySelector('.delete-gallery').addEventListener('click', function () {
      data.gallery.splice(idx, 1);
      renderGalleryEditor();
    });

    // 图片上传
    card.querySelector('.gallery-file-input').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) { showToast('图片请控制在 1MB 以内'); return; }
      var self = this;
      fileToBase64(file, function (b64) {
        data.gallery[idx].src = b64;
        renderGalleryEditor();
      });
    });

    return card;
  }

  document.getElementById('btn-add-gallery').addEventListener('click', function () {
    if (!data.gallery) data.gallery = [];
    data.gallery.push({ id: Date.now(), src: '', title: '', description: '', category: '' });
    renderGalleryEditor();
  });

  function collectGalleryForm() {
    if (!data.gallery) data.gallery = [];
    var cards = document.querySelectorAll('#gallery-edit-list .edit-card');
    cards.forEach(function (card) {
      var idx = parseInt(card.dataset.idx);
      if (isNaN(idx) || idx >= data.gallery.length) return;
      data.gallery[idx].title = card.querySelector('.gallery-title').value.trim();
      data.gallery[idx].category = card.querySelector('.gallery-cat').value.trim();
      data.gallery[idx].description = card.querySelector('.gallery-desc').value.trim();
    });
  }

  /* ===== 生涯时间线编辑 ===== */
  function renderTimelineEditor() {
    var list = document.getElementById('timeline-edit-list');
    list.innerHTML = '';
    (data.timeline || []).forEach(function (item, idx) {
      list.appendChild(createTimelineCard(item, idx));
    });
  }

  function createTimelineCard(item, idx) {
    var card = document.createElement('div');
    card.className = 'edit-card';
    card.dataset.idx = idx;

    var types = [
      { v: 'education', l: '教育' },
      { v: 'work', l: '工作' },
      { v: 'honor', l: '荣誉' },
      { v: 'other', l: '其他' }
    ];

    var typeOpts = types.map(function (t) {
      return '<option value="' + t.v + '"' + (item.type === t.v ? ' selected' : '') + '>' + t.l + '</option>';
    }).join('');

    var imgHTML = item.image
      ? '<img class="edit-card-img" src="' + escapeAttr(item.image) + '" alt=""><button class="btn btn-sm btn-outline remove-timeline-img" style="margin-top:4px;">移除图片</button>'
      : '<div class="edit-card-img-placeholder">🖼️</div>';

    card.innerHTML =
      '<div class="edit-card-header">' +
      '<h3>节点 #' + (idx + 1) + '</h3>' +
      '<button class="btn btn-danger btn-sm delete-timeline">删除</button>' +
      '</div>' +
      '<div class="edit-card-body">' +
      '<div class="form-row">' +
      '<div class="form-group"><label>日期</label><input type="text" class="input timeline-date" value="' + escapeAttr(item.date || '') + '" placeholder="如: 2020 或 2020年6月"></div>' +
      '<div class="form-group"><label>类型</label><select class="input timeline-type">' + typeOpts + '</select></div>' +
      '</div>' +
      '<div class="form-group"><label>标题</label><input type="text" class="input timeline-title" value="' + escapeAttr(item.title || '') + '"></div>' +
      '<div class="form-group"><label>描述</label><textarea class="input timeline-desc" rows="2">' + escapeHtml(item.description || '') + '</textarea></div>' +
      '<div class="form-group"><label>图片（可选）</label>' + imgHTML +
      '<input type="file" accept="image/*" class="timeline-file-input" style="font-size:0.85rem;margin-top:8px;">' +
      '<small style="color:var(--color-text-lighter);">图片建议控制在 500KB 以内</small></div>' +
      '</div>';

    card.querySelector('.delete-timeline').addEventListener('click', function () {
      data.timeline.splice(idx, 1);
      renderTimelineEditor();
    });

    // 图片上传
    card.querySelector('.timeline-file-input').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) { showToast('图片请控制在 500KB 以内'); return; }
      var self = this;
      fileToBase64(file, function (b64) {
        data.timeline[idx].image = b64;
        renderTimelineEditor();
      });
    });

    // 移除图片
    var removeBtn = card.querySelector('.remove-timeline-img');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        data.timeline[idx].image = '';
        renderTimelineEditor();
      });
    }

    return card;
  }

  document.getElementById('btn-add-timeline').addEventListener('click', function () {
    if (!data.timeline) data.timeline = [];
    data.timeline.push({ id: Date.now(), date: '', title: '', description: '', type: 'other', image: '' });
    renderTimelineEditor();
  });

  function collectTimelineForm() {
    if (!data.timeline) data.timeline = [];
    var cards = document.querySelectorAll('#timeline-edit-list .edit-card');
    cards.forEach(function (card) {
      var idx = parseInt(card.dataset.idx);
      if (isNaN(idx) || idx >= data.timeline.length) return;
      data.timeline[idx].date = card.querySelector('.timeline-date').value.trim();
      data.timeline[idx].type = card.querySelector('.timeline-type').value;
      data.timeline[idx].title = card.querySelector('.timeline-title').value.trim();
      data.timeline[idx].description = card.querySelector('.timeline-desc').value.trim();
      // image is already set by file input handler
    });
  }

  /* ===== 保存流程 ===== */
  document.getElementById('btn-save').addEventListener('click', function () {
    // 收集所有表单数据
    collectBasicForm();
    collectGalleryForm();
    collectTimelineForm();

    // 检查是否已配置 GitHub
    if (GitHubAPI.hasConfig()) {
      doSave();
    } else {
      showGitHubModal();
    }
  });

  function showGitHubModal() {
    var modal = document.getElementById('github-modal');
    var cfg = GitHubAPI.getConfig();
    document.getElementById('gh-user').value = cfg.username;
    document.getElementById('gh-repo').value = cfg.repo;
    document.getElementById('gh-token').value = cfg.token;
    document.getElementById('gh-branch').value = cfg.branch;
    modal.style.display = 'flex';

    // 保存按钮事件（先解绑再绑定，防止重复）
    var saveBtn = document.getElementById('gh-save-data');
    var cancelBtn = document.getElementById('gh-cancel');
    var newSaveBtn = saveBtn.cloneNode(true);
    var newCancelBtn = cancelBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.addEventListener('click', function () {
      modal.style.display = 'none';
    });

    newSaveBtn.addEventListener('click', function () {
      var cfg = {
        username: document.getElementById('gh-user').value.trim(),
        repo: document.getElementById('gh-repo').value.trim(),
        token: document.getElementById('gh-token').value.trim(),
        branch: document.getElementById('gh-branch').value.trim() || 'main'
      };
      if (!cfg.username || !cfg.repo || !cfg.token) {
        showToast('请填写完整的 GitHub 配置');
        return;
      }
      GitHubAPI.saveConfig(cfg);
      modal.style.display = 'none';
      doSave();
    });
  }

  function doSave() {
    showToast('正在保存到 GitHub...');
    var jsonContent = JSON.stringify(data, null, 2);
    GitHubAPI.saveDataJSON(jsonContent).then(function () {
      showToast('保存成功！网站将在几秒后更新。');
    }).catch(function (err) {
      showToast('保存失败: ' + err.message);
    });
  }

  /* ===== 工具函数 ===== */
  function setVal(id, val) { document.getElementById(id).value = val || ''; }
  function getVal(id) { return document.getElementById(id).value; }

  function fileToBase64(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsDataURL(file);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showToast(msg, duration) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, duration || 2500);
  }
})();
