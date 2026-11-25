/* Renders the Question Banks page from window.CA_PAPERS (data/papers.js). */
(function () {
  "use strict";

  var root = document.getElementById("qb-root");
  var papers = window.CA_PAPERS || [];
  var exists = {}; // file -> true/false/undefined

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Checks whether the PDF has been uploaded yet.
  function check(file) {
    if (file in exists) return Promise.resolve(exists[file]);
    return fetch(file, { method: "HEAD", cache: "no-cache" })
      .then(function (r) {
        // Some hosts answer 200 with an HTML 404 page; make sure it is not HTML.
        var type = r.headers.get("content-type") || "";
        exists[file] = r.ok && type.indexOf("text/html") === -1;
        return exists[file];
      })
      .catch(function () { exists[file] = false; return false; });
  }

  function renderBank(bank) {
    var row = el("div", "bank");
    var info = el("div", "bank-info");
    info.appendChild(el("div", "bank-title", bank.title));
    if (bank.note) info.appendChild(el("div", "bank-note", bank.note));
    var action = el("span", "pill pill-wait", "Checking…");
    row.appendChild(info);
    row.appendChild(action);

    check(bank.file).then(function (ok) {
      var next;
      if (ok) {
        next = el("a", "pill pill-open", "Open");
        next.href = bank.file;
        next.target = "_blank";
        next.rel = "noopener";
      } else {
        next = el("span", "pill pill-none", "Not uploaded yet");
        next.title = "Upload as: " + bank.file;
      }
      row.replaceChild(next, action);
    });
    return row;
  }

  function renderPaper(paper, open) {
    var card = el("section", "paper");
    var head = el("button", "paper-head");
    head.type = "button";
    head.setAttribute("aria-expanded", open ? "true" : "false");

    var left = el("div", "paper-left");
    left.appendChild(el("div", "paper-code", paper.code + (paper.type ? " · " + paper.type : "")));
    left.appendChild(el("div", "paper-name", paper.name));
    var chev = el("span", "chev", "›");
    head.appendChild(left);
    head.appendChild(chev);

    var body = el("div", "paper-body");
    body.hidden = !open;
    (paper.banks || []).forEach(function (b) { body.appendChild(renderBank(b)); });

    head.addEventListener("click", function () {
      var isOpen = head.getAttribute("aria-expanded") === "true";
      head.setAttribute("aria-expanded", isOpen ? "false" : "true");
      body.hidden = isOpen;
    });

    card.appendChild(head);
    card.appendChild(body);
    return card;
  }

  function render() {
    root.textContent = "";
    var intro = el("p", "intro", "Practice material for each paper. Tap a paper to see what is available.");
    root.appendChild(intro);
    if (!papers.length) {
      root.appendChild(el("p", "empty", "No papers found. Check data/papers.js."));
      return;
    }
    papers.forEach(function (p, i) { root.appendChild(renderPaper(p, i === 0)); });
  }

  render();
})();
