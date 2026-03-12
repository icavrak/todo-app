/**
 * Lightweight API client helper.
 * Wraps fetch with JSON handling and auth-error redirect.
 */
(function () {
  "use strict";

  async function request(method, url, body) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
    };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    // Session expired or not authenticated — redirect and stop execution
    if (res.status === 401) {
      window.location.href = "/login.html";
      throw new Error("Unauthorized");
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        data.error ||
        (data.errors && data.errors.map((e) => e.msg).join(", ")) ||
        "Request failed";
      throw Object.assign(new Error(message), { status: res.status, data });
    }

    return data;
  }

  window.api = {
    get: (url) => request("GET", url),
    post: (url, body) => request("POST", url, body),
    patch: (url, body) => request("PATCH", url, body),
  };
})();
