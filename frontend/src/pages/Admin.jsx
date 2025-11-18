// frontend/src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  async function login(e) {
    e.preventDefault();
    try {
      const res = await API.post("/admin/login", { email, password });
      const t = res.data.token;
      localStorage.setItem("admin_token", t);
      setToken(t);
    } catch {
      alert("Invalid credentials");
    }
  }

  async function fetchData() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [u, l] = await Promise.all([
        API.get("/admin/users", { headers }),
        API.get("/admin/moodlogs", { headers }),
      ]);
      setUsers(u.data);
      setLogs(l.data);
    } catch {
      alert("Session invalid");
      localStorage.removeItem("admin_token");
      setToken("");
    }
  }

  async function removeUser(id) {
    if (!confirm("Delete this user?")) return;

    await API.delete(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers(users.filter((u) => u._id !== id));
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 shadow bg-white">
        <h2 className="text-xl font-bold mb-3">Admin Login</h2>
        <form onSubmit={login}>
          <label>Email</label>
          <input
            className="w-full border p-2 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            className="w-full border p-2 mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={() => {
            localStorage.removeItem("admin_token");
            setToken("");
          }}
          className="border px-3 py-1"
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl mt-6 mb-2">Users</h2>
      <div className="bg-white p-4 shadow rounded">
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mood Logs</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td>{u.name || "-"}</td>
                <td>{u.email}</td>
                <td>{u.moodLogCount}</td>
                <td>
                  <button
                    onClick={() => removeUser(u._id)}
                    className="text-red-600"
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl mt-8 mb-2">Recent Mood Logs</h2>
      <div className="bg-white p-4 shadow rounded">
        {logs.map((l, i) => (
          <div key={i} className="border p-2 mb-2 rounded text-sm">
            <div>User: {l.userId}</div>
            <div>Mood: {l.mood}</div>
            <div>At: {new Date(l.createdAt).toLocaleString()}</div>
            <div>Confidence: {l.confidence ?? "N/A"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
