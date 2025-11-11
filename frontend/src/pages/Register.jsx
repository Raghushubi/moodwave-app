import { useState } from "react";
import API from "../utils/api"; 
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data._id);
      setMessage("Registered successfully!");
      navigate("/dashboard");
    } catch (err) {
      setMessage("Registration failed: " + err.response?.data?.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="p-2 border rounded" required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-2 border rounded" required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="p-2 border rounded" required />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign Up</button>
        </form>
        {message && <p className="text-sm text-center mt-3">{message}</p>}
      </div>
    </div>
  );
}
