/* ============================================================
   《重走长征》· 首页交互逻辑   js/main.js
   负责：SVG路线逐段绘制动画、小红军标记移动、
         节点点击跳转、完成状态标记、资源显示
   存放路径：js/main.js
   页面：index.html
   ============================================================ */
 
(function () {
  /* ---------- 页面入场动画 ---------- */
  document.body.classList.add('page-enter');
 
  /* ---------- 资源显示 ---------- */
  function refresh() {
    var r = getRes();
    var els = {
      '.res-soldiers': fmtNum(r.soldiers),
      '.res-food': r.food + '%',
      '.res-ammo': r.ammo + '%'
    };
    Object.keys(els).forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { el.textContent = els[sel]; });
    });
    document.querySelectorAll('.res-item').forEach(function (el) {
      el.classList.toggle('low', r.food <= 30 || r.ammo <= 30);
    });
    /* 进度显示 */
    var prog = document.getElementById('progressText');
    if (prog) prog.textContent = getDone().length + ' / 7';
  }
  refresh();
 
  /* ---------- 路线逐段绘制动画 ---------- */
  var route = document.getElementById('routePath');
  var drawn = false;
  function drawRoute() {
    if (drawn || !route) return;
    drawn = true;
    route.classList.add('drawing');
    /* 动画结束后，让小红军标记沿路线移动 */
    setTimeout(function () {
      route.classList.remove('drawing');
      route.style.strokeDasharray = 'none';
      moveMarkerToNext();
    }, 5200);
  }
  /* 页面加载即绘制（也可改为滚动到地图才绘制，简化：直接绘制） */
  drawRoute();
 
  /* ---------- 小红军标记沿路线移动 ---------- */
  var marker = document.getElementById('marchMarker');
  function moveMarkerToNext() {
    /* 找到玩家当前应处节点：已完成章节中最大的下一个 */
    var done = getDone();
    var pos = 0;
    while (done.indexOf(pos + 1) > -1) { pos++; }
    placeMarker(pos); /* pos=0 起点，pos=7 终点 */
  }
  function placeMarker(pos) {
    if (!marker || !route) return;
    var pathLen = route.getTotalLength();
    var t = pathLen * (pos / 7);   /* 按章节数均分路径 */
    var pt = route.getPointAtLength(Math.min(t, pathLen));
    marker.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
    marker.style.opacity = 1;
    var tip = document.getElementById('markerTip');
    if (tip) tip.textContent = pos >= 7 ? '会宁·胜利会师' : '红军足迹';
  }
 
  /* ---------- 节点点击跳转 ---------- */
  var nodes = document.querySelectorAll('.node-group');
  nodes.forEach(function (n) {
    n.addEventListener('click', function () {
      var target = n.getAttribute('data-chapter');
      window.location.href = 'chapters/chapter' + target + '.html';
    });
    /* 键盘可达性 */
    n.setAttribute('tabindex', '0');
    n.setAttribute('role', 'button');
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var target = n.getAttribute('data-chapter');
        window.location.href = 'chapters/chapter' + target + '.html';
      }
    });
  });
 
  /* ---------- 完成节点高亮 ---------- */
  var done = getDone();
  nodes.forEach(function (n) {
    var ch = parseInt(n.getAttribute('data-chapter'), 10);
    if (done.indexOf(ch) > -1) {
      n.classList.add('done');
      /* 点亮节点 */
      n.querySelectorAll('.node-dot').forEach(function (d) {
        d.style.fill = '#991010';
        d.classList.remove('pulse');
      });
    }
  });
 
  /* ---------- 重新开始（重置全部进度与资源） ---------- */
  var resetBtn = document.getElementById('btnReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (confirm('确定要重新开始吗？这将重置全部资源与通关进度。')) {
        resetRes();
        localStorage.removeItem(DONE_KEY);
        window.location.reload();
      }
    });
  }
})();
 
