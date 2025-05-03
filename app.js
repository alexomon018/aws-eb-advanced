var Data = {
  current_question: function () {
    Data.question_index = Data.questions.list[Data.questions.index].uuid;
    return Data.questions.list[Data.questions.index];
  },
  question_index: null,
  selected: null,
  score: 0,
  answers_total: 0,
  questions: {
    index: 0,
    list: [],
    fetch: function () {
      m.request({
        method: "GET",
        url: "/questions",
      }).then(function (data) {
        console.log("data", data);
        Data.score = parseInt(data.score) || 0;
        Data.answers_total = parseInt(data.answers_total) || 0;
        Data.questions.list = data.questions;
        Data.questions.index = parseInt(data.questions.index) || 0;
      });
    },
  },
};

var Choice = {
  click: function (n) {
    return function () {
      Data.selected = n;
    };
  },
  classes: function (n) {
    if (Data.selected === n) {
      return "active";
    } else {
      return "";
    }
  },
  view: function (vnode) {
    var n = vnode.attrs.index;
    return m(
      ".choice",
      { class: Choice.classes(n), onclick: Choice.click(n) },
      m("span.l"),
      m("span.v", Data.current_question()[n])
    );
  },
};

var Question = {
  view: function (vnode) {
    return m(".question_wrapper", [
      m(".question", Data.current_question().question || ""),
      m(Choice, { index: "option_a" }),
      m(Choice, { index: "option_b" }),
      m(Choice, { index: "option_c" }),
      m(Choice, { index: "option_d" }),
    ]);
  },
};

var App = {
  oninit: Data.questions.fetch,
  submit: function () {
    const URL = "http://localhost:4567/submit";
    // Extract just the letter from the option name (e.g., 'a' from 'option_a')
    const choiceLetter = Data.selected ? Data.selected.split("_")[1] : null;

    m.request({
      method: "PUT",
      url: URL,
      body: { question_index: Data.question_index, choice: choiceLetter },
    }).then(function (data) {
      console.log("data", data);
      Data.question_index = data.question_index;
      // Find the index of the new question in the list
      Data.questions.index = Data.questions.list.findIndex(
        (q) => q.uuid === data.question_index
      );
      Data.selected = null;
      // Update score and answers_total from the response
      Data.score = parseInt(data.score) || 0;
      Data.answers_total = parseInt(data.answers_total) || 0;
    });
  },
  reset: function () {
    m.request({
      method: "PUT",
      url: "/reset",
    }).then(function (data) {
      Data.score = parseInt(data.score) || 0;
      Data.answers_total = parseInt(data.answers_total) || 0;
      Data.questions.index = parseInt(data.question_index) || 0;
      Data.questions.list = data.questions;
    });
  },
  view: function () {
    return m("main", [
      m("h1", Data.title),
      m(
        "article",
        m("h2", `Question: ${Data.questions.index + 1}`),
        m(Question),
        m(".submit", m("button", { onclick: App.submit }, "Submit"))
      ),
      m("div.progress", [
        m("div.total_questions", "Questions: " + Data.questions.list.length),
        m("div.total_answers", "Answers: " + Data.answers_total),
        m(
          "div.score",
          "Score: " + Data.score + " / " + Data.questions.list.length
        ),
      ]),

      m("div.reset", m("button", { onclick: App.reset }, "Reset")),
    ]);
  },
};

m.mount(document.body, App);
