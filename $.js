window.Toast = (() => {

  // ── Stack registry ─────────────────────────────────────────────────────────
  // Ordered list of all currently visible toast instances (bottom → top).
  const _stack  = []
  const _keyed  = new Map()
  const GAP     = 8 // px between toasts

  function _reposition() {
    let offset = 16 // initial bottom margin (matches bottom-4 = 1rem)
    for (const t of _stack) {
      const h = t.$el[0].offsetHeight || 0
      t.$el.css("bottom", offset + "px").css("top", "").removeClass("bottom-4")
      offset += h + GAP
    }
  }

  function _push(t) {
    _stack.push(t)
    _reposition()
  }

  function _remove(t) {
    const i = _stack.indexOf(t)
    if (i !== -1) _stack.splice(i, 1)
    _reposition()
  }

  // ── Core renderer ──────────────────────────────────────────────────────────
  function _make({ id = null, icon = null, spinner = false, title, sub = null, type = "default", duration = null, closable = false } = {}) {

    const typeClass = {
      default : "border-base-300",
      success : "border-success  text-success",
      warning : "border-warning  text-warning",
      error   : "border-error    text-error",
      info    : "border-info     text-info",
    }[type] ?? "border-base-300"

    const iconHtml = spinner
      ? `<span class="loading loading-spinner loading-sm ${
          { success:"text-success", warning:"text-warning", error:"text-error", info:"text-info", default:"text-warning" }[type] ?? "text-warning"
        }"></span>`
      : icon
        ? `<i class="bi bi-${icon} text-base"></i>`
        : ""

    const $t = $(`
      <div class="fixed left-1/2 -translate-x-1/2 z-[2147483647]
                  flex items-center gap-3 px-4 py-3
                  bg-base-100 border ${typeClass} rounded-2xl shadow-lg
                  transition-all duration-300 opacity-0 translate-y-4 pointer-events-none"
           style="min-width:220px; max-width:90vw; bottom:16px"
           ${id ? `data-toast-id="${id}"` : ""}>
        ${iconHtml}
        <div class="flex flex-col leading-tight flex-1">
          <span class="text-sm font-semibold text-base-content" style="filter:brightness(0.75)">${title}</span>
          ${sub ? `<span class="text-xs text-base-content opacity-60" style="filter:brightness(0.55)">${sub}</span>` : ""}
        </div>
        ${closable ? `<button class="toast-close btn btn-xs btn-ghost btn-circle ml-1 text-base-content opacity-40 hover:opacity-100">✕</button>` : ""}
      </div>
    `).appendTo("body")

    $t.find(".toast-close").on("click", () => destroy())

    let _visible = false
    let _destroyTimer = null

    function show() {
      if (_visible) return
      _visible = true

      const $dialog = $("dialog[open]").last()
      if ($dialog.length) {
        $t.appendTo($dialog)
        $dialog.one("close", () => $t.appendTo("body"))
      } else {
        $t.appendTo("body")
      }

      _push(inst)
      $t[0].offsetHeight
      $t.removeClass("opacity-0 translate-y-4 pointer-events-none")
         .addClass("opacity-100 translate-y-0")
    }
    
    function hide() {
      if (!_visible) return
      _visible = false
      _remove(inst)
      $t.addClass("opacity-0 translate-y-4 pointer-events-none")
         .removeClass("opacity-100 translate-y-0")
    }

    function destroy() {
      clearTimeout(_destroyTimer)
      hide()
      setTimeout(() => $t.remove(), 350)
      if (id) _keyed.delete(id)
    }

    if (duration) _destroyTimer = setTimeout(destroy, duration)

    const inst = { show, hide, destroy, $el: $t }
    return inst
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function show(opts = {}) {
    const t = _make(opts)
    t.show()
    return t
  }

  function keyed(id, opts = {}) {
    if (_keyed.has(id)) return _keyed.get(id)
    const t = _make({ ...opts, id })
    _keyed.set(id, t)
    return t
  }

  const _quick = (type, icon) => (title, opts = {}) =>
    show({ type, icon, title, duration: 2500, closable: true, ...opts })

  return {
    show,
    keyed,
    success : _quick("success", "check-circle-fill"),
    warning : _quick("warning", "exclamation-triangle-fill"),
    error   : _quick("error",   "x-circle-fill"),
    info    : _quick("info",    "info-circle-fill"),
  }

})()