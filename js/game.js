/* ============================================================
   《重走长征》· 游戏通用逻辑   js/game.js
   所有章节页面共用：资源系统、科普弹窗、选项判定、打字机、完成标记
   存放路径：js/game.js
   使用方法：章节页面在 <script src="../js/game.js"></script>
             之后调用 initGame({...}) 传入本章数据
   ============================================================ */
 
/* ---------- 本地存储键名 ---------- */
var RES_KEY = 'lz_resources';   // 资源（兵员/粮食/弹药）
var DONE_KEY = 'lz_done';       // 已完成章节列表
 
/* 初始资源（对应瑞金出发时的历史真实规模） */
var INIT_RES = { soldiers: 86000, food: 100, ammo: 100 };
 
/* ---------- 工具函数 ---------- */
function fmtNum(n) {
  return Number(n).toLocaleString('zh-CN');
}
 
/* ---------- 资源系统 ---------- */
function getRes() {
  try {
    var r = JSON.parse(localStorage.getItem(RES_KEY));
    if (r && typeof r.soldiers === 'number') return r;
  } catch (e) {}
  return { soldiers: INIT_RES.soldiers, food: INIT_RES.food, ammo: INIT_RES.ammo };
}
function saveRes(r) {
  localStorage.setItem(RES_KEY, JSON.stringify(r));
}
function resetRes() {
  saveRes({ soldiers: INIT_RES.soldiers, food: INIT_RES.food, ammo: INIT_RES.ammo });
}
 
/* 应用资源变化：cost = {soldiers:0, food:0, ammo:0}（可为负数） */
function changeRes(cost) {
  cost = cost || {};
  var r = getRes();
  r.soldiers = Math.max(0, r.soldiers + (cost.soldiers || 0));
  r.food = Math.max(0, Math.min(100, r.food + (cost.food || 0)));
  r.ammo = Math.max(0, Math.min(100, r.ammo + (cost.ammo || 0)));
  saveRes(r);
  updateResBar();
  return r;
}
 
/* 刷新页面上的资源数字（带动数字跳动效果） */
function updateResBar() {
  var r = getRes();
  var els = {
    soldiers: document.querySelectorAll('.res-soldiers'),
    food: document.querySelectorAll('.res-food'),
    ammo: document.querySelectorAll('.res-ammo')
  };
  var vals = { soldiers: fmtNum(r.soldiers), food: r.food + '%', ammo: r.ammo + '%' };
  Object.keys(els).forEach(function (k) {
    els[k].forEach(function (el) {
      el.textContent = vals[k];
      el.classList.remove('bounce');
      void el.offsetWidth;            // 强制重排以重启动画
      el.classList.add('bounce');
    });
  });
  /* 低资源告警闪烁 */
  document.querySelectorAll('.res-item').forEach(function (el) {
    var low = (r.food <= 30 || r.ammo <= 30);
    el.classList.toggle('low', low);
  });
}
/* 数字跳动动画（style.css 中无此 keyframes，故在此以JS内联注入） */
(function () {
  var st = document.createElement('style');
  st.textContent = '@keyframes numBounce{0%{transform:scale(1)}30%{transform:scale(1.25)}100%{transform:scale(1)}}.num.bounce{animation:numBounce .5s ease}';
  document.head.appendChild(st);
})();
 
/* ---------- 完成标记 ---------- */
function getDone() {
  try {
    var d = JSON.parse(localStorage.getItem(DONE_KEY));
    if (d && Array.isArray(d)) return d;
  } catch (e) {}
  return [];
}
function markDone(n) {
  var d = getDone();
  if (d.indexOf(n) === -1) {
    d.push(n);
    localStorage.setItem(DONE_KEY, JSON.stringify(d));
  }
}
function isDone(n) {
  return getDone().indexOf(n) > -1;
}
 
/* ---------- 科普弹窗（淡入弹出动画） ---------- */
function showPopup(title, text, costText) {
  /* 先移除旧弹窗 */
  var old = document.querySelector('.popup-mask');
  if (old) old.remove();
 
  var mask = document.createElement('div');
  mask.className = 'popup-mask';
 
  var pop = document.createElement('div');
  pop.className = 'popup';
  pop.innerHTML =
    '<div class="popup-title">' + title + '</div>' +
    '<div class="popup-text">' + text + '</div>' +
    (costText ? '<div class="popup-cost">' + costText + '</div>' : '') +
    '<button class="popup-close">知道了</button>';
 
  mask.appendChild(pop);
  document.body.appendChild(mask);
 
  /* 触发淡入 */
  requestAnimationFrame(function () {
    mask.classList.add('show');
  });
 
  /* 关闭 */
  pop.querySelector('.popup-close').addEventListener('click', function () {
    mask.classList.remove('show');
    setTimeout(function () { mask.remove(); }, 350);
  });
}
 
/* ---------- 打字机效果 ---------- */
function typewriter(el, text, speed, callback) {
  el.innerHTML = '';
  var i = 0;
  var cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);
  var timer = setInterval(function () {
    if (i < text.length) {
      cursor.insertAdjacentText('beforebegin', text.charAt(i));
      i++;
    } else {
      clearInterval(timer);
      cursor.remove();
      if (callback) callback();
    }
  }, speed || 26);
}
 
/* ---------- 资源损失文案辅助 ---------- */
function costText(cost) {
  var parts = [];
  if (cost.soldiers) parts.push('兵员 ' + fmtNum(Math.abs(cost.soldiers)) + ' 人');
  if (cost.food) parts.push('粮食 ' + Math.abs(cost.food) + '%');
  if (cost.ammo) parts.push('弹药 ' + Math.abs(cost.ammo) + '%');
  return parts.length ? '资源变化：' + parts.join('，') : '';
}
 
/* ---------- 章节游戏初始化（章节页面统一调用） ----------
   config = {
     chapter: 1,            // 章节编号
     title: '瑞金出发',      // 章节标题
     date: '1934年10月',     // 时间
     story: '剧情文本…',
     options: [ { text:'选项A', correct:true,  cost:{soldiers:0}, popupTitle:'…', popupText:'…' }, ... ],
     next: 2,               // 下一章编号；最后一章填 null
     onPass: function(res){} // 选对后额外操作（可选）
   }
------------------------------------------------------------ */
function initGame(config) {
  var chapter = config.chapter;
  var answered = false;
 
  /* 页面入场动画 */
  document.body.classList.add('page-enter');
 
  /* 顶部资源条渲染 */
  updateResBar();
 
  /* 章节标题 */
  document.getElementById('chTitle').textContent = config.title;
  document.getElementById('chDate').textContent = config.date;
 
  /* 剧情打字机 */
  var storyBox = document.getElementById('storyBox');
  typewriter(storyBox, config.story, 24, function () {
    renderOptions();
  });
 
  function renderOptions() {
    var wrap = document.getElementById('options');
    wrap.innerHTML = '';
    /* 无选项的章节（如会师总结页）：直接标记完成并显示下一步 */
    if (!config.options || !config.options.length) {
      markDone(chapter);
      showNextArea();
      return;
    }
    config.options.forEach(function (opt, idx) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.innerHTML = '<span class="opt-key">' + ['A','B','C','D'][idx] + '</span><span>' + opt.text + '</span>';
      btn.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        handleChoice(opt, btn);
      });
      wrap.appendChild(btn);
    });
  }
 
  function handleChoice(opt, btn) {
    /* 锁定所有选项 */
    document.querySelectorAll('.option-btn').forEach(function (b) { b.disabled = true; });
 
    var fb = document.getElementById('feedback');
    var r = changeRes(opt.cost || {});
 
    if (opt.correct) {
      btn.classList.add('chosen-good');
      fb.className = 'feedback good show';
      fb.textContent = '✓ 你的抉择与当年红军的行动方向一致。';
      markDone(chapter);
      /* 若有选对后的额外文案 */
      if (opt.afterText) {
        var after = document.createElement('div');
        after.style.marginTop = '10px';
        after.textContent = opt.afterText;
        fb.appendChild(after);
      }
      if (config.onPass) config.onPass(r);
      showNextArea();
    } else {
      btn.classList.add('chosen-bad');
      fb.className = 'feedback bad show';
      fb.textContent = '✗ 这个方案在当时行不通。看看真实历史中红军面对怎样的困境——';
      /* 弹出史实科普 */
      showPopup(opt.popupTitle || '史实科普', opt.popupText, costText(opt.cost));
      showNextArea();
    }
  }
 
  function showNextArea() {
    var area = document.getElementById('nextArea');
    area.innerHTML = '';
    var btnNext, btnMap;
 
    if (config.next) {
      btnNext = document.createElement('button');
      btnNext.className = 'btn-primary';
      btnNext.textContent = '继续行军 → 第' + (chapter + 1) + '站';
      btnNext.addEventListener('click', function () {
        window.location.href = 'chapter' + config.next + '.html';
      });
    } else {
      /* 最后一章：无下一章按钮 */
      btnNext = document.createElement('button');
      btnNext.className = 'btn-primary';
      btnNext.textContent = '查看会师总结';
      btnNext.addEventListener('click', function () {
        var finishEl = document.getElementById('finishArea');
        if (finishEl) {
          finishEl.scrollIntoView({ behavior: 'smooth' });
          if (config.onFinish) config.onFinish();
        }
      });
    }
 
    btnMap = document.createElement('button');
    btnMap.className = 'btn-ghost';
    btnMap.textContent = '返回长征地图';
    btnMap.addEventListener('click', function () {
      window.location.href = '../index.html';
    });
 
    area.appendChild(btnNext);
    area.appendChild(btnMap);
  }
}
 
/* ---------- 返回地图快捷函数 ---------- */
function goHome() {
  window.location.href = '../index.html';
}
 
