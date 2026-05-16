/* ===== GitHub API 工具 ===== */
var GitHubAPI = (function () {
  /* 从 sessionStorage 读取配置（仅当次会话有效，更安全） */
  function getConfig() {
    return {
      username: sessionStorage.getItem('gh_user') || '',
      repo: sessionStorage.getItem('gh_repo') || '',
      token: sessionStorage.getItem('gh_token') || '',
      branch: sessionStorage.getItem('gh_branch') || 'main'
    };
  }

  function saveConfig(cfg) {
    sessionStorage.setItem('gh_user', cfg.username);
    sessionStorage.setItem('gh_repo', cfg.repo);
    sessionStorage.setItem('gh_token', cfg.token);
    sessionStorage.setItem('gh_branch', cfg.branch || 'main');
  }

  function clearConfig() {
    sessionStorage.removeItem('gh_user');
    sessionStorage.removeItem('gh_repo');
    sessionStorage.removeItem('gh_token');
    sessionStorage.removeItem('gh_branch');
  }

  function hasConfig() {
    var c = getConfig();
    return !!(c.username && c.repo && c.token);
  }

  /* 获取 data.json 的 SHA（更新文件时需要） */
  function getFileSHA(cfg, path) {
    var url = 'https://api.github.com/repos/' + cfg.username + '/' + cfg.repo + '/contents/' + path + '?ref=' + cfg.branch;
    return fetch(url, {
      headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('获取文件信息失败 (' + res.status + '): ' + path);
      return res.json();
    }).then(function (json) {
      return json.sha;
    });
  }

  /* 更新/创建文件 */
  function putFile(cfg, path, content, sha, message) {
    var url = 'https://api.github.com/repos/' + cfg.username + '/' + cfg.repo + '/contents/' + path;
    var body = {
      message: message || 'Update ' + path + ' via editor',
      content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    return fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (e) { throw new Error(e.message || '上传失败 (' + res.status + ')'); });
      }
      return res.json();
    });
  }

  /* 保存 data.json */
  function saveDataJSON(jsonContent) {
    var cfg = getConfig();
    var path = 'data.json';

    // 先尝试获取现有文件的 SHA
    return getFileSHA(cfg, path).then(function (sha) {
      return putFile(cfg, path, jsonContent, sha);
    }).catch(function (err) {
      // 如果文件不存在（404），则创建
      if (err.message.indexOf('404') !== -1) {
        return putFile(cfg, path, jsonContent, null, 'Create data.json via editor');
      }
      throw err;
    });
  }

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    clearConfig: clearConfig,
    hasConfig: hasConfig,
    saveDataJSON: saveDataJSON
  };
})();
