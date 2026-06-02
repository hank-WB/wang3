const apiBaseFromQuery = new URLSearchParams(window.location.search).get("apiBase");
const apiBaseFromStorage = window.localStorage.getItem("diaomingbai_api_base");
const apiBaseFromConfig = window.DIAOMINGBAI_API_BASE;

const API_BASE =
  apiBaseFromQuery ||
  apiBaseFromStorage ||
  apiBaseFromConfig ||
  "http://127.0.0.1:3000/api/v1";

const state = {
  selectedFish: "鲤鱼",
  sessionId: null,
  apiMode: "mock",
  review: null,
  messages: [],
  recommendations: [],
  history: []
};

const fishSpeciesSeed = [
  { id: "1", code: "crucian_carp", name: "鲫鱼" },
  { id: "2", code: "carp", name: "鲤鱼" },
  { id: "3", code: "grass_carp", name: "草鱼" }
];

const mockStore = {
  sessionId: "1001",
  recommendations: [
    {
      id: "7001",
      recommendation_stage: "initial",
      recommendation_type: "spot_selection",
      content: "优先试深浅交界和回弯位置",
      reason_summary: "这种条件下目标鱼更可能在相对稳定区域活动。",
      is_user_accepted: null
    },
    {
      id: "7002",
      recommendation_stage: "initial",
      recommendation_type: "wait_more",
      content: "第一轮先守一会，别急着高频换位",
      reason_summary: "慢口局最怕一上来把节奏打乱。",
      is_user_accepted: null
    }
  ],
  messages: [
    {
      id: "9001",
      sender_type: "ai",
      message_type: "text",
      content:
        "今天这个天气冲鲤鱼不是没机会，但更像慢口局。优先试深浅交界和回弯感更强的位置，第一轮先稳着打。",
      related_stage: "arrived",
      trigger_type: "manual",
      created_at: new Date().toISOString()
    }
  ]
};

const mockApi = {
  async listFishSpecies() {
    return { items: fishSpeciesSeed };
  },

  async createSession({ fishName }) {
    const fish = fishSpeciesSeed.find((item) => item.name === fishName) ?? fishSpeciesSeed[1];
    return {
      session: {
        id: mockStore.sessionId,
        session_title: `今天冲${fish.name}`,
        target_fish_species_id: fish.id,
        mode: "target_fish_mode",
        status: "preparing"
      }
    };
  },

  async uploadEnvironment() {
    return {
      snapshot: {
        id: "5001",
        session_id: mockStore.sessionId,
        snapshot_type: "start",
        water_type: "wild_river",
        water_shape_type: "curved",
        temperature: "26.5",
        pressure: "1008"
      }
    };
  },

  async openSession(fishName) {
    return {
      summary: "今天更像慢口局，先稳着打，别急着乱换位。",
      ai_message: {
        id: "9001",
        sender_type: "ai",
        message_type: "text",
        content: `今天这个天气冲${fishName}不是没机会，但更像慢口局。优先试深浅交界和回弯感更强的位置，第一轮先以稳和守为主。`,
        related_stage: "arrived",
        trigger_type: "manual",
        created_at: new Date().toISOString()
      },
      recommendations: mockStore.recommendations,
      follow_up_questions: ["你现在准备守近还是打远？", "现场有明显走水吗？"]
    };
  },

  async sendMessage(text) {
    const userMessage = {
      id: `${Date.now()}`,
      sender_type: "user",
      message_type: "text",
      content: text,
      related_stage: "fishing",
      trigger_type: "manual",
      created_at: new Date().toISOString()
    };

    const aiMessage = {
      id: `${Date.now() + 1}`,
      sender_type: "ai",
      message_type: "text",
      content:
        "先别急，我帮你看。这场局现在更重要的是稳节奏，优先告诉我你是没口、轻口，还是怀疑点位不对，我再帮你拆下一步。",
      related_stage: "adjustment",
      trigger_type: "manual",
      created_at: new Date().toISOString()
    };

    mockStore.messages.push(userMessage, aiMessage);
    return { user_message: userMessage, ai_message: aiMessage, recommendations: [], generated_events: [] };
  },

  async listMessages() {
    return { items: mockStore.messages };
  },

  async runNoBiteAdjustment() {
    mockStore.recommendations = [
      {
        id: "7201",
        recommendation_stage: "no_bite_adjustment",
        recommendation_type: "tease_fishing",
        content: "先轻逗两三竿",
        reason_summary: "先测试鱼层和活性，别一上来大改。",
        is_user_accepted: null
      },
      {
        id: "7202",
        recommendation_stage: "no_bite_adjustment",
        recommendation_type: "wait_more",
        content: "再守 15 分钟，先别急着换位",
        reason_summary: "这种天气下目标鱼开口可能偏慢，太早挪位容易把节奏打乱。",
        is_user_accepted: null
      }
    ];

    const aiMessage = {
      id: `${Date.now() + 10}`,
      sender_type: "ai",
      message_type: "text",
      content:
        "你现在这情况更像慢口，不是完全没鱼。先别急着换位，优先轻逗两三竿，再守 15 分钟。如果还是没动静，我们再考虑小范围挪位。",
      related_stage: "adjustment",
      trigger_type: "manual",
      created_at: new Date().toISOString()
    };

    mockStore.messages.push({
      id: `${Date.now() + 9}`,
      sender_type: "user",
      message_type: "text",
      content: "我已经 30 分钟没口了，轻微走水，刚补过窝。",
      related_stage: "adjustment",
      trigger_type: "manual",
      created_at: new Date().toISOString()
    });
    mockStore.messages.push(aiMessage);

    return {
      summary: "当前更像慢口，不建议立刻放弃鲤鱼。",
      ai_message: aiMessage,
      recommendations: mockStore.recommendations,
      should_change_spot: false,
      should_change_target: false
    };
  },

  async updateRecommendation(recommendationId, accepted) {
    mockStore.recommendations = mockStore.recommendations.map((item) =>
      item.id === recommendationId
        ? {
            ...item,
            is_user_accepted: accepted,
            accepted_at: new Date().toISOString()
          }
        : item
    );

    return {
      recommendation: mockStore.recommendations.find((item) => item.id === recommendationId)
    };
  },

  async finishSession() {
    return {
      session: {
        id: mockStore.sessionId,
        status: "finished",
        end_time: new Date().toISOString(),
        duration_minutes: 160,
        result_type: "partial_success",
        catch_count: 2,
        catch_summary: "上了 2 条鲫鱼，目标鲤鱼未完成"
      }
    };
  },

  async generateReview(fishName) {
    state.review = {
      target_result: false,
      environment_summary:
        "夏季上午，弯曲型野河，多云，气压 1008，存在轻微变天迹象。整体更像慢口环境，目标鱼开口节奏偏谨慎。",
      process_summary:
        `你今天主攻${fishName}，前期以守为主。中途出现 30 分钟没口，并补窝一次，后续尝试轻逗和继续守钓。`,
      problem_summary:
        "主要问题不是点位完全错误，而是目标鱼开口偏慢。这场更像是“口慢没等到”，而不是“方向完全错了”。",
      adjustment_summary:
        "AI 建议你先稳窝、轻逗、延后换位。这些调整没有马上带来目标鱼，但判断方向是对的。",
      next_time_suggestion:
        "先守住节奏，再做微调。类似天气下继续冲鲤鱼时，优先选更稳定的回弯或深浅交界位置。",
      final_ai_summary: "今天这场不算白打，问题不在乱，而在目标鱼口慢。"
    };

    return { review: state.review };
  },

  async getReview() {
    return { review: state.review };
  },

  async listHistory() {
    return {
      items: [
        {
          id: "1001",
          session_title: "今天冲鲤鱼",
          target_fish: { id: "2", code: "carp", name: "鲤鱼" },
          status: "finished",
          result_type: "partial_success",
          catch_count: 2,
          catch_summary: "上了 2 条鲫鱼，目标鲤鱼未完成",
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 160,
          review_summary: "目标鱼未完成，但判断和纠偏过程有效。",
          has_review: true
        },
        {
          id: "1000",
          session_title: "昨天守鲫鱼",
          target_fish: { id: "1", code: "crucian_carp", name: "鲫鱼" },
          status: "finished",
          result_type: "success",
          catch_count: 6,
          catch_summary: "接口期明显，节奏稳。",
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 120,
          review_summary: "接口期判断对，节奏稳，复盘价值高。",
          has_review: true
        }
      ]
    };
  }
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

const api = {
  async call(realCall, mockCall) {
    try {
      const data = await realCall();
      setApiMode("live");
      return data;
    } catch (_error) {
      setApiMode("mock");
      return mockCall();
    }
  },

  listFishSpecies() {
    return this.call(() => request("/fish-species"), () => mockApi.listFishSpecies());
  },

  createSession(fishName) {
    const fish = fishSpeciesSeed.find((item) => item.name === fishName) ?? fishSpeciesSeed[1];
    return this.call(
      () =>
        request("/fishing-sessions", {
          method: "POST",
          body: JSON.stringify({
            target_fish_species_id: fish.id,
            mode: "target_fish_mode",
            session_title: `今天冲${fish.name}`
          })
        }),
      () => mockApi.createSession({ fishName })
    );
  },

  uploadEnvironment(sessionId) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/environment-snapshots`, {
          method: "POST",
          body: JSON.stringify({
            snapshot_type: "start",
            location_name: "杭州某野河钓点",
            water_type: "wild_river",
            water_shape_type: "curved",
            temperature: 26.5,
            humidity: 74,
            pressure: 1008,
            wind_speed: 2.3,
            wind_direction: "southeast",
            weather_condition: "cloudy",
            day_night_temp_diff: 5,
            is_weather_changing: true,
            time_period: "morning",
            season: "summer",
            user_reported_conditions: {
              water_current: "slight",
              small_fish_disturbance: false
            }
          })
        }),
      () => mockApi.uploadEnvironment()
    );
  },

  openSession(sessionId, fishName) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/ai/opening`, {
          method: "POST",
          body: JSON.stringify({
            force_regenerate: false
          })
        }),
      () => mockApi.openSession(fishName)
    );
  },

  sendMessage(sessionId, text) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/messages`, {
          method: "POST",
          body: JSON.stringify({
            message_type: "text",
            content: text,
            related_stage: "fishing"
          })
        }),
      () => mockApi.sendMessage(text)
    );
  },

  listMessages(sessionId) {
    return this.call(
      () => request(`/fishing-sessions/${sessionId}/messages`),
      () => mockApi.listMessages()
    );
  },

  runNoBiteAdjustment(sessionId) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/adjustments/no-bite`, {
          method: "POST",
          body: JSON.stringify({
            no_bite_duration_minutes: 30,
            current_conditions: {
              small_fish_disturbance: false,
              water_current: "slight",
              has_changed_spot: false,
              has_changed_bait: false,
              has_added_groundbait: true
            }
          })
        }),
      () => mockApi.runNoBiteAdjustment()
    );
  },

  updateRecommendation(sessionId, recommendationId, accepted) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/recommendations/${recommendationId}`, {
          method: "PATCH",
          body: JSON.stringify({
            is_user_accepted: accepted,
            effect_feedback: accepted ? "用户已采纳建议" : "用户暂未采纳"
          })
        }),
      () => mockApi.updateRecommendation(recommendationId, accepted)
    );
  },

  finishSession(sessionId) {
    return this.call(
      () =>
        request(`/fishing-sessions/${sessionId}/finish`, {
          method: "POST",
          body: JSON.stringify({
            result_type: "partial_success",
            catch_count: 2,
            catch_summary: "上了 2 条鲫鱼，目标鲤鱼未完成"
          })
        }),
      () => mockApi.finishSession()
    );
  },

  generateReview(sessionId, fishName) {
    return this.call(
      () => request(`/fishing-sessions/${sessionId}/review/generate`, { method: "POST", body: JSON.stringify({}) }),
      () => mockApi.generateReview(fishName)
    );
  },

  getReview(sessionId) {
    return this.call(
      () => request(`/fishing-sessions/${sessionId}/review`),
      () => mockApi.getReview()
    );
  },

  listHistory() {
    return this.call(
      () => request("/fishing-sessions?page=1&page_size=10&status=finished"),
      () => mockApi.listHistory()
    );
  }
};

const views = document.querySelectorAll(".view");
const apiModeLabel = document.getElementById("apiModeLabel");
const targetFishInput = document.getElementById("targetFishInput");
const targetFishName = document.getElementById("targetFishName");
const openingFishName = document.getElementById("openingFishName");
const reviewFishName = document.getElementById("reviewFishName");
const sessionTitle = document.getElementById("sessionTitle");
const chatLog = document.getElementById("chatLog");
const recommendList = document.getElementById("recommendList");
const historyList = document.getElementById("historyList");
const chatInput = document.getElementById("chatInput");
const historySheet = document.getElementById("historySheet");
const adjustmentSheet = document.getElementById("adjustmentSheet");

function setApiMode(mode) {
  state.apiMode = mode;
  apiModeLabel.textContent =
    mode === "live"
      ? `接口模式：已连接后端`
      : `接口模式：演示数据`;
}

function switchView(viewId) {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
}

function syncFish() {
  targetFishName.textContent = state.selectedFish;
  openingFishName.textContent = state.selectedFish;
  reviewFishName.textContent = state.selectedFish;
  sessionTitle.textContent = `今天冲${state.selectedFish}`;
  targetFishInput.value = state.selectedFish;
}

function renderMessages() {
  chatLog.innerHTML = "";
  state.messages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${message.sender_type === "user" ? "user" : "ai"}`;
    bubble.textContent = message.content;
    chatLog.appendChild(bubble);
  });
}

function renderRecommendations() {
  recommendList.innerHTML = "";
  state.recommendations.forEach((item) => {
    const card = document.createElement("article");
    card.className = "recommend-card";
    card.innerHTML = `
      <div class="recommend-title">${item.content}</div>
      <div class="card-copy">${item.reason_summary ?? ""}</div>
      <div class="recommend-actions">
        <button class="mini-button ${item.is_user_accepted === true ? "active" : ""}" data-id="${item.id}" data-value="true">采纳建议</button>
        <button class="mini-button ${item.is_user_accepted === false ? "active" : ""}" data-id="${item.id}" data-value="false">暂不采纳</button>
      </div>
    `;
    recommendList.appendChild(card);
  });

  recommendList.querySelectorAll(".mini-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const recommendationId = button.dataset.id;
      const accepted = button.dataset.value === "true";
      const result = await api.updateRecommendation(state.sessionId, recommendationId, accepted);
      state.recommendations = state.recommendations.map((item) =>
        item.id === result.recommendation.id ? result.recommendation : item
      );
      renderRecommendations();
    });
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  state.history.forEach((item) => {
    const article = document.createElement("article");
    article.className = "history-item";
    article.innerHTML = `
      <div class="session-pill">${item.target_fish?.name ?? "未指定"} / ${item.status === "finished" ? "已结束" : "进行中"}</div>
      <h3>${item.session_title}</h3>
      <p>${item.review_summary ?? "这场记录还没有复盘摘要。"}</p>
    `;
    historyList.appendChild(article);
  });
}

function fillReview(review) {
  if (!review) return;
  document.querySelector(".summary-card h2").textContent = review.final_ai_summary;
  const cards = document.querySelectorAll(".review-stack .stack-card p");
  cards[0].textContent = review.environment_summary;
  cards[1].textContent = review.process_summary;
  cards[2].textContent = review.problem_summary;
  cards[3].textContent = review.next_time_suggestion;
}

function openSheet(sheet) {
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeSheet(sheet) {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
}

async function bootstrapHistory() {
  const result = await api.listHistory();
  state.history = result.items;
  renderHistory();
}

async function startSessionFlow() {
  const fishName = targetFishInput.value.trim() || state.selectedFish;
  state.selectedFish = fishName;
  syncFish();

  const created = await api.createSession(fishName);
  state.sessionId = created.session.id;
  await api.uploadEnvironment(state.sessionId);
  const opening = await api.openSession(state.sessionId, fishName);
  state.messages = [opening.ai_message];
  state.recommendations = opening.recommendations;
  renderMessages();
  renderRecommendations();
  switchView("companionView");
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text || !state.sessionId) return;
  const result = await api.sendMessage(state.sessionId, text);
  state.messages.push(result.user_message, result.ai_message);
  chatInput.value = "";
  renderMessages();
}

async function runAdjustment() {
  if (!state.sessionId) return;
  closeSheet(adjustmentSheet);
  const result = await api.runNoBiteAdjustment(state.sessionId);
  state.messages = (await api.listMessages(state.sessionId)).items;
  state.recommendations = result.recommendations;
  renderMessages();
  renderRecommendations();
}

async function finishAndReview() {
  if (!state.sessionId) {
    switchView("reviewView");
    return;
  }

  await api.finishSession(state.sessionId);
  await api.generateReview(state.sessionId, state.selectedFish);
  const result = await api.getReview(state.sessionId);
  state.review = result.review;
  fillReview(state.review);
  switchView("reviewView");
  await bootstrapHistory();
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    state.selectedFish = chip.dataset.fish;
    syncFish();
  });
});

document.getElementById("brandButton").addEventListener("click", () => switchView("homeView"));
document.getElementById("startSessionButton").addEventListener("click", startSessionFlow);
document.getElementById("jumpToCompanionButton").addEventListener("click", startSessionFlow);
document.getElementById("sendChatButton").addEventListener("click", sendChat);
document.getElementById("finishButton").addEventListener("click", finishAndReview);
document.getElementById("backHomeButton").addEventListener("click", () => switchView("homeView"));
document.getElementById("restartButton").addEventListener("click", () => switchView("homeView"));

document.getElementById("openHistoryButton").addEventListener("click", async () => {
  await bootstrapHistory();
  openSheet(historySheet);
});
document.getElementById("openHistoryFromReviewButton").addEventListener("click", async () => {
  await bootstrapHistory();
  openSheet(historySheet);
});
document.getElementById("closeHistoryButton").addEventListener("click", () => closeSheet(historySheet));
document.getElementById("openReviewFromHomeButton").addEventListener("click", async () => {
  await finishAndReview();
});

document.querySelectorAll(".quick-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.action;
    if (action === "no-bite") {
      openSheet(adjustmentSheet);
      return;
    }

    const quickMap = {
      groundbait: "我刚补了一点窝。",
      spot: "我换了个位置。",
      bait: "我换了个饵。",
      current: "现在有点走水。",
      "small-fish": "杂鱼开始闹了。"
    };

    chatInput.value = quickMap[action];
    await sendChat();
  });
});

document.getElementById("closeAdjustmentButton").addEventListener("click", () => closeSheet(adjustmentSheet));
document.getElementById("runAdjustmentButton").addEventListener("click", runAdjustment);

syncFish();
bootstrapHistory();
