/* CA Tracker - Question bank.
   Views (URL hash):  #            -> list of papers
                      #paper1      -> chapters of a paper
                      #paper1/ch1  -> questions of a chapter
   Content lives in data/*.js files, one per paper (see data/papers.js). */
(function () {
  "use strict";

  /* Data files call QB.register("paper1", { chapters: [...] }) */
  const QB = (window.QB = { papers: {}, register: function (id, data) { this.papers[id] = data; } });
  const el = CAT.el;
  const root = document.getElementById("qb-root");

  /* ---------- loading ---------- */
  function loadPaper(paper) {
    return new Promise(function (resolve) {
      if (QB.papers[paper.id]) return resolve(QB.papers[paper.id]);
      const s = document.createElement("script");
      s.src = paper.file;
      s.onload = function () { resolve(QB.papers[paper.id] || null); };
      s.onerror = function () { resolve(null); };
      document.head.append(s);
    });
  }

  function countQuestions(data) {
    if (!data || !data.chapters) return 0;
    return data.chapters.reduce(function (n, c) { return n + (c.questions ? c.questions.length : 0); }, 0);
  }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  /* ---------- shared pieces ---------- */
  function crumbs(parts) {
    const box = el("nav", { class: "crumbs", "aria-label": "Breadcrumb" });
    parts.forEach(function (p, i) {
      if (i > 0) box.append(el("span", { text: "/" }));
      box.append(p.href ? el("a", { href: p.href, text: p.label }) : el("span", { text: p.label }));
    });
    return box;
  }
  function emptyState(message, file) {
    const box = el("div", { class: "empty" }, [el("p", { text: message })]);
    if (file) {
      const p = el("p", {});
      p.append("Add content in ", el("code", { text: file }), ".");
      box.append(p);
    }
    return box;
  }
  function rowLink(href, title, meta, badge) {
    return el("a", { class: "row", href: href, style: "text-decoration:none;color:inherit" }, [
      el("div", { class: "grow" }, [el("div", { class: "title", text: title }), el("div", { class: "meta", text: meta })]),
      el("span", { class: "badge", text: badge })
    ]);
  }

  /* ---------- views ---------- */
  function showPapers() {
    root.replaceChildren(
      el("h1", { text: "Question Banks" }),
      el("p", { class: "sub", text: "Pick a paper to practise." }),
      el("div", { class: "list", id: "paper-list" })
    );
    const list = document.getElementById("paper-list");
    window.QB_PAPERS.forEach(function (paper) {
      const row = rowLink("#" + paper.id, paper.title, "Loading...", "");
      list.append(row);
      loadPaper(paper).then(function (data) {
        const n = countQuestions(data);
        row.querySelector(".meta").textContent = n ? plural(data.chapters.length, "chapter") : "No questions added yet";
        row.querySelector(".badge").textContent = plural(n, "question");
      });
    });
  }

  function showPaper(paper) {
    root.replaceChildren(
      crumbs([{ label: "Question Banks", href: "#" }, { label: paper.title }]),
      el("h1", { text: paper.title }),
      el("div", { id: "chapter-list" })
    );
    const box = document.getElementById("chapter-list");
    loadPaper(paper).then(function (data) {
      if (!data || !data.chapters || !data.chapters.length) {
        box.append(emptyState("No chapters yet.", paper.file));
        return;
      }
      const list = el("div", { class: "list" });
      data.chapters.forEach(function (ch) {
        const n = ch.questions ? ch.questions.length : 0;
        list.append(rowLink("#" + paper.id + "/" + ch.id, ch.title, n ? "Tap to practise" : "No questions yet", plural(n, "question")));
      });
      box.append(list);
    });
  }

  function showChapter(paper, chapterId) {
    root.replaceChildren(el("p", { class: "sub", text: "Loading..." }));
    loadPaper(paper).then(function (data) {
      const ch = data && data.chapters && data.chapters.find(function (c) { return c.id === chapterId; });
      if (!ch) { location.hash = "#" + paper.id; return; }
      root.replaceChildren(
        crumbs([{ label: "Question Banks", href: "#" }, { label: paper.title, href: "#" + paper.id }, { label: ch.title }]),
        el("h1", { text: ch.title })
      );
      if (!ch.questions || !ch.questions.length) {
        root.append(emptyState("No questions in this chapter yet.", paper.file));
        return;
      }
      ch.questions.forEach(function (q, i) { root.append(renderQuestion(q, i + 1)); });
    });
  }

  /* ---------- a single question ---------- */
  function renderQuestion(q, number) {
    const card = el("article", { class: "q" });
    const tagText = (q.type === "mcq" ? "Multiple choice" : "Descriptive") + (q.marks ? " - " + q.marks + " marks" : "");
    card.append(el("div", { class: "tag", text: "Q" + number + " - " + tagText }));
    card.append(el("p", { class: "qtext", text: q.question }));

    if (q.type === "mcq" && Array.isArray(q.options)) {
      const buttons = [];
      const feedback = el("div", { class: "answer", hidden: "" });
      q.options.forEach(function (opt, idx) {
        const b = el("button", { class: "opt", text: opt });
        b.addEventListener("click", function () {
          buttons.forEach(function (x, j) {
            x.disabled = true;
            if (j === q.answer) x.classList.add("correct");
          });
          if (idx !== q.answer) b.classList.add("wrong");
          feedback.textContent = (idx === q.answer ? "Correct. " : "Not quite. ") + (q.explanation || "");
          feedback.hidden = false;
        });
        buttons.push(b);
        card.append(b);
      });
      card.append(feedback);
    } else {
      const ans = el("div", { class: "answer", hidden: "", text: q.answer || "Answer not added yet." });
      const btn = el("button", { class: "reveal", text: "Show answer" });
      btn.addEventListener("click", function () {
        ans.hidden = !ans.hidden;
        btn.textContent = ans.hidden ? "Show answer" : "Hide answer";
      });
      card.append(btn, ans);
    }
    return card;
  }

  /* ---------- routing ---------- */
  function route() {
    const parts = location.hash.replace(/^#/, "").split("/");
    const paper = window.QB_PAPERS.find(function (p) { return p.id === parts[0]; });
    if (!paper) return showPapers();
    if (parts[1]) return showChapter(paper, parts[1]);
    showPaper(paper);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
