import { useState } from "react";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiImage, FiUpload } from "react-icons/fi";

export default function AddItem() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    image: null,
    price_per_day: "",
    security_deposit: "",
    mobile_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { user, setglobaldata, setuploadData, globaldata, uploadData } =
    useUserContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      alert("User information is missing. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("user", user);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("price_per_day", formData.price_per_day);
    formDataToSend.append("security_deposit", formData.security_deposit);
    formDataToSend.append("mobile_number", formData.mobile_number);

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      const response = await axios.post(
        "/api/upload",
        formDataToSend,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Item added successfully!");
      const newItem = response.data.item;

      setglobaldata((prevData) =>
        prevData ? [...prevData, newItem] : [newItem]
      );
      setuploadData((prevData) =>
        prevData ? [...prevData, newItem] : [newItem]
      );

      setFormData({
        name: "",
        description: "",
        category: "",
        image: null,
        price_per_day: "",
        security_deposit: "",
        mobile_number: "",
      });
    } catch (error) {
      console.error(
        "Error adding item:",
        error.response?.data || error.message
      );
      alert("Failed to add item. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)" }}>
      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-indigo-600/[0.06] rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/[0.06] rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2.5 text-gray-400 hover:text-white transition-all duration-300 group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl group-hover:bg-indigo-500/20 transition-all duration-300" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <FiArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="rounded-2xl p-8 lg:p-10" style={{ background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Add New Item</h1>
            <p className="text-sm text-gray-500">List an item for your campus community</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Engineering Textbook"
                  className="w-full px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Books, Electronics"
                  className="w-full px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Daily Price (₹)
                </label>
                <input
                  type="number"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  name="security_deposit"
                  value={formData.security_deposit}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your item in detail..."
                  className="w-full h-32 px-4 py-3.5 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-600 resize-none"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Upload Image
                </label>
                <div className="relative rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 group cursor-pointer" style={{ background: "rgba(255, 255, 255, 0.02)", border: "2px dashed rgba(255, 255, 255, 0.08)" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 text-indigo-400 group-hover:text-indigo-300 transition-colors" style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
                      <FiImage size={22} />
                    </div>
                    <p className="text-sm text-gray-400">
                      {formData.image
                        ? formData.image.name
                        : "Click to upload"}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload size={16} />
                    Submit Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
