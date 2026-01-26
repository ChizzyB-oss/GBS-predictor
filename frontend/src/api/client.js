// ==============================================
// BASE URL (EXPORTED SO ALL COMPONENTS CAN USE IT)
// ==============================================
export const API_BASE_URL = "http://127.0.0.1:8000";

// ==============================================
// GENERIC REQUEST HANDLER
// ==============================================
async function apiRequest(
  path,
  { method = "GET", body, token, ...options } = {}
) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // ignore empty or non-JSON bodies
  }

  if (!response.ok) {
    const message =
      data?.detail || data?.error || data?.message || response.statusText;

    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ==============================================
// SPECIAL HANDLER FOR PDF DOWNLOADS
// ==============================================
async function apiDownload(path, token) {
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  return response; // caller handles blob()
}

// ==============================================
// AUTH API  (MFA SUPPORT — CORRECTED)
// ==============================================
const AUTH_PREFIX = "/api/auth";

export const authApi = {
  // -----------------------------
  // REGISTRATION & LOGIN
  // -----------------------------
  registerClinician(payload) {
    return apiRequest(`${AUTH_PREFIX}/register`, {
      method: "POST",
      body: payload,
    });
  },

  loginClinician(payload) {
    return apiRequest(`${AUTH_PREFIX}/login`, {
      method: "POST",
      body: payload,
    });
  },

  loginAdmin(payload) {
    return apiRequest(`${AUTH_PREFIX}/login-admin`, {
      method: "POST",
      body: payload,
    });
  },

  // -----------------------------
  // MFA — SETUP FLOW
  // -----------------------------

  // 1️⃣ Enable MFA → returns QR PNG
  enableMfa(token) {
    return apiDownload(`${AUTH_PREFIX}/enable-mfa`, token);
  },

  // 2️⃣ Confirm MFA (OTP after scanning QR)
  confirmMfa({ otp }, token) {
    return apiRequest(`${AUTH_PREFIX}/confirm-mfa`, {
      method: "POST",
      body: { otp },
      token,
    });
  },

  // 3️⃣ Disable MFA
  disableMfa(token) {
    return apiRequest(`${AUTH_PREFIX}/disable-mfa`, {
      method: "POST",
      token,
    });
  },

  // -----------------------------
  // MFA LOGIN
  // -----------------------------
  verifyMfa({ temp_token, otp }) {
  return apiRequest(`${AUTH_PREFIX}/verify-mfa`, {
    method: "POST",
    body: { otp, temp_token },
  });
},

  // -----------------------------
  // CURRENT USER
  // -----------------------------
  getCurrentUser(token) {
    return apiRequest(`${AUTH_PREFIX}/me`, {
      method: "GET",
      token,
    });
  },
};


// ==============================================
// PREDICTION + HISTORY + PDF REPORTS
// ==============================================
export const predictionApi = {
  makePrediction(payload, token) {
    return apiRequest("/api/predictions/predict", {
      method: "POST",
      body: payload,
      token,
    });
  },

  getMyHistory(token) {
    return apiRequest("/api/prediction/history", {
      method: "GET",
      token,
    });
  },

  // ✅ ADD THIS
  getPredictionById(predictionId, token) {
    return apiRequest(`/api/prediction/${predictionId}`, {
      method: "GET",
      token,
    });
  },

  downloadReport(predictionId, token) {
    return apiDownload(`/api/predictions/${predictionId}/report`, token);
  },

  getSharedPredictionById(predictionId, token) {
  return apiRequest(`/api/prediction/shared/${predictionId}`, {
    method: "GET",
    token,
  });
},
};

// ==============================================
// CLINICIAN DASHBOARD
// ==============================================
export const clinicianApi = {
  getStats(token) {
    return apiRequest("/api/clinician/stats", {
      method: "GET",
      token,
    });
  },
};

// ==============================================
// ADMIN DASHBOARD
// ==============================================
export const adminApi = {
  getStats(token) {
    return apiRequest("/api/admin/stats", {
      method: "GET",
      token,
    });
  },

  getRecentPredictions(token) {
    return apiRequest("/api/admin/recent-predictions", {
      method: "GET",
      token,
    });
  },

  getUsers(token) {
    return apiRequest("/api/admin/users", {
      method: "GET",
      token,
    });
  },

  deleteUser(userId, token) {
    return apiRequest(`/api/admin/users/${userId}`, {
      method: "DELETE",
      token,
    });
  },
};

// ==============================================
// ANALYTICS
// ==============================================
export const analyticsApi = {
  predictionsOverTime(token) {
    return apiRequest("/api/analytics/predictions-over-time", {
      method: "GET",
      token,
    });
  },

  subtypeDistribution(token) {
    return apiRequest("/api/analytics/subtype-distribution", {
      method: "GET",
      token,
    });
  },
};

// ==============================================
// ADMIN SETTINGS
// ==============================================
export const adminSettingsApi = {
  getSettings(token) {
    return apiRequest("/api/admin/settings", {
      method: "GET",
      token,
    });
  },

  updateSettings(payload, token) {
    return apiRequest("/api/admin/settings", {
      method: "PUT",
      body: payload,
      token,
    });
  },
};

// ==============================================
// PROFILE
// ==============================================
export const profileApi = {
  getProfile(token) {
    return apiRequest("/api/profile", {
      method: "GET",
      token,
    });
  },

  updateProfile(payload, token) {
    return apiRequest("/api/profile", {
      method: "PUT",
      body: payload,
      token,
    });
  },
};

export const chatbotApi = {
  explainPrediction: async (payload, token) => {
    const res = await fetch(`${API_BASE_URL}/chat/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Chatbot request failed");
    }

    return res.json();
  },
};

// ==============================================
// PEER REVIEW (CLINICIAN-TO-CLINICIAN)
// ==============================================
export const reviewApi = {
  listColleagues(token) {
    return apiRequest("/api/reviews/colleagues", { method: "GET", token });
  },
  requestReview(payload, token) {
    return apiRequest("/api/reviews/request", { method: "POST", body: payload, token });
  },
  inbox(token) {
    return apiRequest("/api/reviews/inbox", { method: "GET", token });
  },
  updateStatus(reviewId, status, token) {
    return apiRequest(`/api/reviews/${reviewId}/status`, {
      method: "PATCH",
      body: { status },
      token,
    });
  },
};